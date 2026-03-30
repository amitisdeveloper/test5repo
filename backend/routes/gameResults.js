const express = require('express');
const GamePublishedResult = require('../models/GamePublishedResult');
const Game = require('../models/Game');
const eventEmitter = require('../utils/eventEmitter');
const { getGameDayStart, getGameDayEnd } = require('../utils/timezone');
const router = express.Router();

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
  if (user.role === 'admin') {
    return true;
  }

  const game = await Game.findOne({
    _id: gameId,
    assignedUsers: user.userId,
    isActive: true
  }).select('_id');

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

// POST: Publish a new result for a game
router.post('/', verifyToken, verifyResultManager, async (req, res) => {
  try {
    const { gameId, publishDate, publishedNumber } = req.body;

    // Validate required fields
    if (!gameId || !publishDate || !publishedNumber) {
      return res.status(400).json({ error: 'gameId, publishDate, and publishedNumber are required' });
    }

    // Verify the game exists
    const game = await Game.findById(gameId);
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
      return res.status(409).json({ error: 'A result for this game already exists on this dated' });
    }

    const newResult = new GamePublishedResult({
      gameId,
      publishDate: dateStart,
      publishedNumber: publishedNumber.toString(),
      createdBy: req.user.userId,
      updatedBy: req.user.userId,
      auditTrail: [{
        action: 'created',
        previousValue: null,
        newValue: publishedNumber.toString(),
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

    eventEmitter.emit('result-posted', { type: 'result-posted', gameId, publishedNumber });

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
    const { page = 1, limit = 10, startDate, endDate, gameId } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.publishDate = {};
      if (startDate) {
        query.publishDate.$gte = getGameDayStart(new Date(startDate));
      }
      if (endDate) {
        query.publishDate.$lte = getGameDayEnd(new Date(endDate));
      }
    }

    // Add game filter
    if (gameId) {
      query.gameId = gameId;
    }

    if (userContext && userContext.role !== 'admin') {
      const accessibleGameIds = await Game.find({
        assignedUsers: userContext.userId,
        isActive: true
      }).distinct('_id');

      query.gameId = query.gameId
        ? (accessibleGameIds.some((id) => id.toString() === query.gameId.toString()) ? query.gameId : null)
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
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Fetch results
    const results = await GamePublishedResult.find(query)
      .populate('gameId', 'name nickName resultTime')
      .populate('createdBy', 'username name role')
      .populate('updatedBy', 'username name role')
      .populate('auditTrail.changedBy', 'username name role')
      .sort({ publishDate: -1 })
      .limit(limitNum)
      .skip(skip);

    // Get total count
    const total = await GamePublishedResult.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    res.json({
      results,
      pagination: {
        currentPage: pageNum,
        totalPages: pages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNext: pageNum < pages,
        hasPrev: pageNum > 1
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

    if (!publishedNumber) {
      return res.status(400).json({ error: 'publishedNumber is required' });
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
    result.publishedNumber = publishedNumber.toString();
    result.updatedBy = req.user.userId;
    result.auditTrail.push({
      action: 'updated',
      previousValue,
      newValue: publishedNumber.toString(),
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
