const express = require('express');
const Game = require('../models/Game');
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

// Get all games
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 50, name } = req.query;
    const query = { isActive: true };
    
    if (status) {
      query.status = status;
    }

    if (name) {
      query.nickName = { $regex: name, $options: 'i' };
    }

    const games = await Game.find(query)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Game.countDocuments(query);

    const gamesWithName = games.map(game => {
      const gameObj = game.toObject();
      if (!gameObj.name && gameObj.nickName) {
        gameObj.name = gameObj.nickName;
      }
      return gameObj;
    });

    res.json({
      games: gamesWithName,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get latest result for a specific game - MUST come before /:id
router.get('/latest-result', async (req, res) => {
  try {
    const Result = require('../models/Result');
    
    // Get the most recent result from any game
    const latestResult = await Result.findOne()
      .sort({ createdAt: -1 })
      .populate('gameId', 'nickName name');

    if (!latestResult) {
      return res.json(null);
    }

    res.json({
      result: latestResult.result,
      name: latestResult.gameId ? latestResult.gameId.nickName || latestResult.gameId.name : 'Unknown',
      date: latestResult.createdAt,
      gameId: latestResult.gameId
    });
  } catch (error) {
    console.error('Get latest result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to get all games with filters and pagination - MUST come before /:id
router.get('/admin', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const { page = 1, limit = 9, gameType, startDate, endDate, name, nickName } = req.query;
    
    let isAuthenticated = false;
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        isAuthenticated = true;
      } catch (e) {
        console.log('Token verification failed:', e.message);
      }
    }

    const query = {};
    
    if (gameType) {
      query.gameType = gameType;
    }
    
    if (name || nickName) {
      query.nickName = { $regex: name || nickName, $options: 'i' };
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDateObj;
      }
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 9;
    const skip = (pageNum - 1) * limitNum;

    const games = await Game.find(query)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);

    const total = await Game.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    const gamesWithName = games.map(game => {
      const gameObj = game.toObject();
      if (!gameObj.name && gameObj.nickName) {
        gameObj.name = gameObj.nickName;
      }
      return gameObj;
    });

    console.log('Admin endpoint - Query:', JSON.stringify(query), '| Games found:', games.length, '| Total:', total);

    res.json({
      games: gamesWithName,
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
    console.error('Get admin games error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get game by ID - MUST come after specific routes
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const game = await Game.findById(id).populate('createdBy', 'username email');
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(game);
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new game
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, nickName, description, status = 'active', gameType = 'lottery', drawTime, startTime, endTime, settings, isActive = true } = req.body;

    const gameName = nickName || name;
    if (!gameName) {
      return res.status(400).json({ error: 'Game name is required' });
    }

    const newGame = new Game({
      name: gameName,
      nickName: gameName,
      description,
      status,
      gameType,
      drawTime,
      startTime,
      endTime,
      isActive,
      createdBy: req.user.userId,
      settings
    });

    await newGame.save();
    await newGame.populate('createdBy', 'username email');

    res.status(201).json(newGame);
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update game
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, nickName, description, status, gameType, drawTime, startTime, endTime, settings, isActive } = req.body;
    
    const game = await Game.findById(id);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Check if user is admin or the creator of the game
    if (req.user.role !== 'admin' && game.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update this game' });
    }

    // Update game fields
    if (name) game.name = name;
    if (nickName) game.nickName = nickName;
    if (description !== undefined) game.description = description;
    if (status) game.status = status;
    if (gameType) game.gameType = gameType;
    if (drawTime !== undefined) game.drawTime = drawTime;
    if (startTime) game.startTime = startTime;
    if (endTime) game.endTime = endTime;
    if (settings) game.settings = { ...game.settings, ...settings };
    if (isActive !== undefined) game.isActive = isActive;

    await game.save();
    await game.populate('createdBy', 'username email');

    res.json(game);
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete game
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const game = await Game.findById(id);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Check if user is admin or the creator of the game
    if (req.user.role !== 'admin' && game.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this game' });
    }

    // Soft delete - just mark as inactive
    game.isActive = false;
    await game.save();

    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get games by user
router.get('/user/my-games', verifyToken, async (req, res) => {
  try {
    const games = await Game.find({ 
      createdBy: req.user.userId,
      isActive: true 
    }).populate('createdBy', 'username email').sort({ createdAt: -1 });

    res.json(games);
  } catch (error) {
    console.error('Get user games error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;