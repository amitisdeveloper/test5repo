const express = require('express');
const Game = require('../../models/Game');
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

// Special routes FIRST (before /:id catch-all)
// GET /api/games/types - Get game types
router.get('/types', (req, res) => {
  res.json({
    types: [
      { value: 'lottery', label: 'Lottery' },
      { value: 'draw', label: 'Draw' },
      { value: 'raffle', label: 'Raffle' },
      { value: 'prime', label: 'Prime Game' },
      { value: 'local', label: 'Local Game' }
    ]
  });
});

// GET /api/games/admin - Get all games for admin with latest results (authenticated)
router.get('/admin', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 9 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const games = await Game.find({ isActive: true })
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Game.countDocuments({ isActive: true });

    // Get latest result for each game
    const gamesWithLatestResults = await Promise.all(
      games.map(async (game) => {
        const latestResult = await Result.findOne({ gameId: game._id })
          .sort({ createdAt: -1 })
          .limit(1);
        
        return {
          ...game.toObject(),
          latestResult: latestResult ? {
            result: latestResult.result,
            date: latestResult.drawDate,
            time: latestResult.drawDate.toTimeString().split(' ')[0]
          } : null
        };
      })
    );

    res.json({
      games: gamesWithLatestResults,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get admin games error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/games/latest-result - Get latest result
router.get('/latest-result', async (req, res) => {
  try {
    const Result = require('../../models/Result');
    const latestResult = await Result.findOne()
      .populate('gameId', 'name')
      .sort({ createdAt: -1 });

    res.json(latestResult || {});
  } catch (error) {
    console.error('Get latest result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generic routes (with catch-all at the end)
// GET /api/games - Get all games
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 50, gameType } = req.query;
    const query = { isActive: true };
    
    if (status) {
      query.status = status;
    }
    
    if (gameType) {
      query.gameType = gameType;
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

// POST /api/games - Create new game
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

// GET /api/games/:id - Get a single game
router.get('/:id', verifyToken, async (req, res) => {
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

// PUT /api/games/:id - Update a game
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, gameType, drawTime, settings } = req.body;

    const game = await Game.findById(id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (name) game.name = name;
    if (description) game.description = description;
    if (status) game.status = status;
    if (gameType) game.gameType = gameType;
    if (drawTime) game.drawTime = drawTime;
    if (settings) game.settings = settings;

    await game.save();
    await game.populate('createdBy', 'username email');

    res.json(game);
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/games/:id - Delete a game
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const game = await Game.findByIdAndDelete(id);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;