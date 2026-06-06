const express = require('express');
const GamePublishedResult = require('../models/GamePublishedResult');
const Game = require('../models/Game');
const eventEmitter = require('../utils/eventEmitter');
const { getGameDayStart, getGameDayEnd } = require('../utils/timezone');
const router = express.Router();
const BULK_IMPORT_MODES = ['skip', 'overwrite'];
const PLACEHOLDER_RESULTS = new Set(['--', '##', 'wait']);

const isPlaceholderResult = (value) => PLACEHOLDER_RESULTS.has(
  String(value || '').trim().toLowerCase()
);

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  const jwt = require('jsonwebtoken');
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const canManageGame = async (user, gameId) => {
  const query = {
    _id: gameId,
    archivedAt: null
  };

  if (user.role !== 'admin') {
    query.assignedUsers = user.userId;
    query.isActive = true;
  }

  const game = await Game.findOne(query).select('_id');

  return !!game;
};

const verifyResultManager = async (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.role !== 'subadmin' && req.user.role !== 'user') {
    return res.status(403).json({ error: 'Only administrators or assigned subadmins can perform this action' });
  }

  next();
};

const getBulkRowDateValue = (row) => row?.publishDate || row?.date || '';
const getBulkRowNumberValue = (row) => row?.publishedNumber || row?.number || '';

// POST: Publish a new result for a game
router.post('/', verifyToken, verifyResultManager, async (req, res) => {
  try {
    const { gameId, publishDate, publishedNumber } = req.body;
    const normalizedPublishedNumber = String(publishedNumber || '').trim();

    // Validate required fields
    if (!gameId || !publishDate || !normalizedPublishedNumber) {
      return res.status(400).json({ error: 'gameId, publishDate, and publishedNumber are required' });
    }

    if (isPlaceholderResult(normalizedPublishedNumber)) {
      return res.status(400).json({ error: 'Enter a real result. Placeholder values such as --, ##, or wait are not allowed.' });
    }

    // Verify the game exists
    const game = await Game.findOne({ _id: gameId, archivedAt: null });
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const hasAccess = await canManageGame(req.user, gameId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'You are not assigned to this game shift' });
    }

    const parsedDate = new Date(publishDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const dateStart = getGameDayStart(parsedDate);
    const dateEnd = getGameDayEnd(parsedDate);

    console.log('🕒 === PUBLISH RESULT DATE CHECK ===');
    console.log('Requested publishDate:', publishDate);
    console.log('Parsed date:', parsedDate.toISOString());
    console.log('Game day start:', dateStart.toISOString());
    console.log('Game day end:', dateEnd.toISOString());
    console.log('Game ID:', gameId);

    const existingResult = await GamePublishedResult.findOne({
      gameId,
      publishDate: {
        $gte: dateStart,
        $lte: dateEnd
      }
    });

    console.log('Existing result found:', !!existingResult);
    if (existingResult) {
      console.log('Existing result publishDate:', existingResult.publishDate.toISOString());
    }
    console.log('🕒 =========================');

    if (existingResult) {
      if (isPlaceholderResult(existingResult.publishedNumber)) {
        const previousValue = existingResult.publishedNumber;
        existingResult.publishedNumber = normalizedPublishedNumber;
        existingResult.updatedBy = req.user.userId;
        existingResult.auditTrail.push({
          action: 'updated',
          previousValue,
          newValue: normalizedPublishedNumber,
          changedBy: req.user.userId,
          changedAt: new Date()
        });

        await existingResult.save();
        await existingResult.populate([
          { path: 'gameId', select: 'name nickName' },
          { path: 'createdBy', select: 'username name role' },
          { path: 'updatedBy', select: 'username name role' },
          { path: 'auditTrail.changedBy', select: 'username name role' }
        ]);

        eventEmitter.emit('result-posted', {
          type: 'result-posted',
          gameId,
          publishedNumber: normalizedPublishedNumber
        });

        return res.json(existingResult);
      }

      return res.status(409).json({ error: 'A result for this game already exists on this date' });
    }

    const newResult = new GamePublishedResult({
      gameId,
      publishDate: dateStart,
      publishedNumber: normalizedPublishedNumber,
      createdBy: req.user.userId,
      updatedBy: req.user.userId,
      auditTrail: [{
        action: 'created',
        previousValue: null,
        newValue: normalizedPublishedNumber,
        changedBy: req.user.userId,
        changedAt: new Date()
      }]
    });

    await newResult.save();
    await newResult.populate([
      { path: 'gameId', select: 'name nickName' },
      { path: 'createdBy', select: 'username name role' },
      { path: 'updatedBy', select: 'username name role' },
      { path: 'auditTrail.changedBy', select: 'username name role' }
    ]);

    eventEmitter.emit('result-posted', {
      type: 'result-posted',
      gameId,
      publishedNumber: normalizedPublishedNumber
    });

    res.status(201).json(newResult);
  } catch (error) {
    console.error('Create published result error:', error);
    // Handle Mongoose unique constraint error
    if (error.code === 11000) {
      return res.status(409).json({ error: 'A result for this game already exists on this datee' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST: Bulk publish results for a single game
router.post('/bulk', verifyToken, verifyResultManager, async (req, res) => {
  try {
    const { gameId, rows, mode = 'skip' } = req.body;

    if (!gameId) {
      return res.status(400).json({ error: 'gameId is required' });
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'rows must be a non-empty array' });
    }

    if (rows.length > 1000) {
      return res.status(400).json({ error: 'A maximum of 1000 rows can be imported at once' });
    }

    if (!BULK_IMPORT_MODES.includes(mode)) {
      return res.status(400).json({ error: 'mode must be either skip or overwrite' });
    }

    const game = await Game.findOne({ _id: gameId, archivedAt: null })
      .select('_id nickName name');
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const hasAccess = await canManageGame(req.user, gameId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'You are not assigned to this game shift' });
    }

    const normalizedRows = [];
    const validationErrors = [];
    const seenDates = new Map();

    rows.forEach((row, index) => {
      const lineNumber = Number(row?.lineNumber) || (index + 1);
      const rawDate = String(getBulkRowDateValue(row)).trim();
      const rawNumber = String(getBulkRowNumberValue(row)).trim();

      if (!rawDate) {
        validationErrors.push(`Line ${lineNumber}: date is required`);
        return;
      }

      if (!rawNumber) {
        validationErrors.push(`Line ${lineNumber}: published number is required`);
        return;
      }

      if (isPlaceholderResult(rawNumber)) {
        validationErrors.push(`Line ${lineNumber}: placeholder results such as --, ##, or wait are not allowed`);
        return;
      }

      const parsedDate = new Date(rawDate);
      if (isNaN(parsedDate.getTime())) {
        validationErrors.push(`Line ${lineNumber}: invalid date "${rawDate}"`);
        return;
      }

      const normalizedPublishDate = getGameDayStart(parsedDate);
      const dateKey = normalizedPublishDate.toISOString();

      if (seenDates.has(dateKey)) {
        validationErrors.push(`Line ${lineNumber}: duplicate date also provided on line ${seenDates.get(dateKey)}`);
        return;
      }

      seenDates.set(dateKey, lineNumber);
      normalizedRows.push({
        lineNumber,
        publishedNumber: rawNumber,
        publishDate: normalizedPublishDate,
        dateKey
      });
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Bulk import validation failed',
        details: validationErrors
      });
    }

    const existingResults = await GamePublishedResult.find({
      gameId,
      publishDate: { $in: normalizedRows.map((row) => row.publishDate) }
    });

    const existingResultsMap = new Map(
      existingResults.map((result) => [result.publishDate.toISOString(), result])
    );

    const newDocuments = [];
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of normalizedRows) {
      const existingResult = existingResultsMap.get(row.dateKey);

      if (existingResult) {
        if (mode === 'skip' || existingResult.publishedNumber === row.publishedNumber) {
          skipped += 1;
          continue;
        }

        const previousValue = existingResult.publishedNumber;
        existingResult.publishedNumber = row.publishedNumber;
        existingResult.updatedBy = req.user.userId;
        existingResult.auditTrail.push({
          action: 'updated',
          previousValue,
          newValue: row.publishedNumber,
          changedBy: req.user.userId,
          changedAt: new Date()
        });

        await existingResult.save();
        updated += 1;
        continue;
      }

      newDocuments.push({
        gameId,
        publishDate: row.publishDate,
        publishedNumber: row.publishedNumber,
        createdBy: req.user.userId,
        updatedBy: req.user.userId,
        auditTrail: [{
          action: 'created',
          previousValue: null,
          newValue: row.publishedNumber,
          changedBy: req.user.userId,
          changedAt: new Date()
        }]
      });
    }

    if (newDocuments.length > 0) {
      await GamePublishedResult.insertMany(newDocuments, { ordered: true });
      inserted = newDocuments.length;
    }

    if (inserted > 0 || updated > 0) {
      eventEmitter.emit('result-posted', {
        type: 'result-posted',
        gameId,
        bulk: true,
        inserted,
        updated
      });
    }

    res.json({
      message: 'Bulk result import completed',
      summary: {
        gameId,
        gameName: game.nickName || game.name || 'Unknown Game',
        processed: normalizedRows.length,
        inserted,
        updated,
        skipped,
        mode
      }
    });
  } catch (error) {
    console.error('Bulk publish results error:', error);

    if (error.code === 11000) {
      return res.status(409).json({ error: 'One or more results already exist for the selected dates' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET: List all published results with pagination and filtering
// Public endpoint for archives
router.get('/', async (req, res) => {
  // Check if token is provided (for admin features)
  const jwt = require('jsonwebtoken');
  const token = req.header('Authorization')?.replace('Bearer ', '');
  let userContext = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      userContext = decoded;
    } catch (error) {
      // Token invalid or expired, continue as public user
    }
  }

  try {
    const { page = 1, limit = 10, startDate, endDate, gameId, all } = req.query;
    const query = {};
    const fetchAll = all === 'true';

    if (startDate || endDate) {
      query.publishDate = {};
      if (startDate) {
        query.publishDate.$gte = getGameDayStart(new Date(startDate));
      }
      if (endDate) {
        query.publishDate.$lte = getGameDayEnd(new Date(endDate));
      }
    }

    const accessibleGamesQuery = { archivedAt: null };
    if (userContext && userContext.role !== 'admin') {
      accessibleGamesQuery.assignedUsers = userContext.userId;
      accessibleGamesQuery.isActive = true;
    }

    const accessibleGameIds = await Game.find(accessibleGamesQuery).distinct('_id');
    query.gameId = gameId
      ? (accessibleGameIds.some((id) => id.toString() === gameId.toString()) ? gameId : null)
      : { $in: accessibleGameIds };

    if (query.gameId === null) {
      return res.json({
        results: [],
        pagination: {
          currentPage: parseInt(page) || 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: parseInt(limit) || 10,
          hasNext: false,
          hasPrev: false
        }
      });
    }

    const pageNum = fetchAll ? 1 : (parseInt(page) || 1);
    const limitNum = fetchAll ? 0 : (parseInt(limit) || 10);
    const skip = (pageNum - 1) * limitNum;

    // Fetch results
    const resultsQuery = GamePublishedResult.find(query)
      .populate('gameId', 'name nickName resultTime')
      .populate('createdBy', 'username name role')
      .populate('updatedBy', 'username name role')
      .populate('auditTrail.changedBy', 'username name role')
      .sort({ publishDate: -1 });

    if (!fetchAll) {
      resultsQuery.limit(limitNum).skip(skip);
    }

    const results = await resultsQuery;

    // Get total count
    const total = await GamePublishedResult.countDocuments(query);
    const pages = fetchAll ? (total > 0 ? 1 : 0) : Math.ceil(total / limitNum);

    res.json({
      results,
      pagination: {
        currentPage: pageNum,
        totalPages: pages,
        totalItems: total,
        itemsPerPage: fetchAll ? total : limitNum,
        hasNext: !fetchAll && pageNum < pages,
        hasPrev: !fetchAll && pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get published results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET: Get a specific published result by ID
router.get('/:id', verifyToken, verifyResultManager, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await GamePublishedResult.findById(id)
      .populate('gameId', 'name nickName')
      .populate('createdBy', 'username name role')
      .populate('updatedBy', 'username name role')
      .populate('auditTrail.changedBy', 'username name role');

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    const hasAccess = await canManageGame(req.user, result.gameId._id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'You are not assigned to this game shift' });
    }

    res.json(result);
  } catch (error) {
    console.error('Get published result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT: Update a published result
router.put('/:id', verifyToken, verifyResultManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { publishedNumber } = req.body;
    const normalizedPublishedNumber = String(publishedNumber || '').trim();

    if (!normalizedPublishedNumber) {
      return res.status(400).json({ error: 'publishedNumber is required' });
    }

    if (isPlaceholderResult(normalizedPublishedNumber)) {
      return res.status(400).json({ error: 'Enter a real result. Placeholder values such as --, ##, or wait are not allowed.' });
    }

    const result = await GamePublishedResult.findById(id);

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    const hasAccess = await canManageGame(req.user, result.gameId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'You are not assigned to this game shift' });
    }

    // Update the published number
    const previousValue = result.publishedNumber;
    result.publishedNumber = normalizedPublishedNumber;
    result.updatedBy = req.user.userId;
    result.auditTrail.push({
      action: 'updated',
      previousValue,
      newValue: normalizedPublishedNumber,
      changedBy: req.user.userId,
      changedAt: new Date()
    });
    await result.save();

    await result.populate([
      { path: 'gameId', select: 'name nickName' },
      { path: 'createdBy', select: 'username name role' },
      { path: 'updatedBy', select: 'username name role' },
      { path: 'auditTrail.changedBy', select: 'username name role' }
    ]);

    res.json(result);
  } catch (error) {
    console.error('Update published result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE: Delete a published result
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can delete results' });
    }

    const { id } = req.params;
    const result = await GamePublishedResult.findById(id);

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    await GamePublishedResult.findByIdAndDelete(id);

    res.json({ message: 'Result deleted successfully' });
  } catch (error) {
    console.error('Delete published result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
