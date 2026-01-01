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

// Middleware to verify admin role
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can perform this action' });
  }
  next();
};

// POST: Publish a new result for a game
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
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

    const parsedDate = new Date(publishDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const dateStart = getGameDayStart(parsedDate);
    const dateEnd = getGameDayEnd(parsedDate);

    const existingResult = await GamePublishedResult.findOne({
      gameId,
      publishDate: {
        $gte: dateStart,
        $lte: dateEnd
      }
    });

    if (existingResult) {
      return res.status(409).json({ error: 'A result for this game already exists on this date' });
    }

    const newResult = new GamePublishedResult({
      gameId,
      publishDate: dateStart,
      publishedNumber: publishedNumber.toString(),
      createdBy: req.user.userId
    });

    await newResult.save();
    await newResult.populate([
      { path: 'gameId', select: 'name nickName' },
      { path: 'createdBy', select: 'username' }
    ]);

    eventEmitter.emit('result-posted', { type: 'result-posted', gameId, publishedNumber });

    res.status(201).json(newResult);
  } catch (error) {
    console.error('Create published result error:', error);
    // Handle Mongoose unique constraint error
    if (error.code === 11000) {
      return res.status(409).json({ error: 'A result for this game already exists on this date' });
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
  let isAdmin = false;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      isAdmin = decoded.role === 'admin';
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

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Fetch results
    const results = await GamePublishedResult.find(query)
      .populate('gameId', 'name nickName resultTime')
      .populate('createdBy', 'username')
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
router.get('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await GamePublishedResult.findById(id)
      .populate('gameId', 'name nickName')
      .populate('createdBy', 'username');

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Get published result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT: Update a published result
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
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

    // Update the published number
    result.publishedNumber = publishedNumber.toString();
    await result.save();

    await result.populate([
      { path: 'gameId', select: 'name nickName' },
      { path: 'createdBy', select: 'username' }
    ]);

    res.json(result);
  } catch (error) {
    console.error('Update published result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE: Delete a published result
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
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
