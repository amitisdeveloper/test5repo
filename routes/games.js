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
    const { status, page = 1, limit = 50 } = req.query;
    const query = { isActive: true };
    
    if (status) {
      query.status = status;
    }

    const games = await Game.find(query)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Game.countDocuments(query);

    res.json({
      games,
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

// Get game by ID
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
    const { name, description, status = 'active', gameType = 'lottery', drawTime, settings } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Game name is required' });
    }

    const newGame = new Game({
      name,
      description,
      status,
      gameType,
      drawTime,
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
    const { name, description, status, gameType, drawTime, settings, isActive } = req.body;
    
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
    if (description !== undefined) game.description = description;
    if (status) game.status = status;
    if (gameType) game.gameType = gameType;
    if (drawTime !== undefined) game.drawTime = drawTime;
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