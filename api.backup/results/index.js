const express = require('express');
const Result = require('../../models/Result');
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
// POST /api/results/publish - Publish result for a game (authenticated)
router.post('/publish', verifyToken, async (req, res) => {
  try {
    const { gameId, left, center, right } = req.body;

    if (!gameId || !left || !center || !right) {
      return res.status(400).json({ error: 'Game ID and all result numbers are required' });
    }

    const Game = require('../../models/Game');
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const result = `${left}${center}${right}`;
    const newResult = new Result({
      gameId,
      result,
      resultNumbers: { left, center, right },
      drawDate: new Date(),
      isOfficial: req.user.role === 'admin',
      verifiedBy: req.user.role === 'admin' ? req.user.userId : null,
      verifiedAt: req.user.role === 'admin' ? new Date() : null
    });

    await newResult.save();
    await newResult.populate([
      { path: 'gameId', select: 'name gameType' },
      { path: 'verifiedBy', select: 'username' }
    ]);

    res.status(201).json(newResult);
  } catch (error) {
    console.error('Publish result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/results/latest/:gameId - Get latest results for a game
router.get('/latest/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { limit = 10 } = req.query;
    
    const results = await Result.find({ gameId })
      .populate('gameId', 'name gameType')
      .sort({ drawDate: -1 })
      .limit(parseInt(limit));
    
    res.json(results);
  } catch (error) {
    console.error('Get latest results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/results/stats/:gameId - Get result statistics
router.get('/stats/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const stats = await Result.aggregate([
      { $match: { gameId: require('mongoose').Types.ObjectId(gameId) } },
      {
        $group: {
          _id: null,
          totalResults: { $sum: 1 },
          officialResults: { $sum: { $cond: ['$isOfficial', 1, 0] } },
          averagePrizePool: { $avg: '$totalPrizePool' }
        }
      }
    ]);
    
    res.json(stats[0] || {
      totalResults: 0,
      officialResults: 0,
      averagePrizePool: 0
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generic routes (after special routes)
// GET /api/results - Get all results
router.get('/', async (req, res) => {
  try {
    const { gameId, limit = 50, page = 1, isOfficial } = req.query;
    const query = {};
    
    if (gameId) {
      query.gameId = gameId;
    }
    
    if (isOfficial !== undefined) {
      query.isOfficial = isOfficial === 'true';
    }

    const results = await Result.find(query)
      .populate('gameId', 'name gameType')
      .populate('verifiedBy', 'username')
      .sort({ drawDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Result.countDocuments(query);

    res.json({
      results,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/results - Create new result
router.post('/', verifyToken, async (req, res) => {
  try {
    const { 
      gameId, 
      result, 
      resultNumbers, 
      winningNumbers, 
      drawDate,
      prizeDistribution,
      totalPrizePool,
      drawNumber 
    } = req.body;

    if (!gameId || !result) {
      return res.status(400).json({ error: 'Game ID and result are required' });
    }

    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const newResult = new Result({
      gameId,
      result,
      resultNumbers,
      winningNumbers,
      drawDate: drawDate || new Date(),
      prizeDistribution,
      totalPrizePool,
      drawNumber,
      isOfficial: req.user.role === 'admin',
      verifiedBy: req.user.role === 'admin' ? req.user.userId : null,
      verifiedAt: req.user.role === 'admin' ? new Date() : null
    });

    await newResult.save();
    await newResult.populate([
      { path: 'gameId', select: 'name gameType' },
      { path: 'verifiedBy', select: 'username' }
    ]);

    res.status(201).json(newResult);
  } catch (error) {
    console.error('Create result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/results/:id - Get a single result
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Result.findById(id)
      .populate('gameId', 'name gameType')
      .populate('verifiedBy', 'username');

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Get result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/results/:id - Update a result (authenticated)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Result.findById(id);

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    Object.assign(result, req.body);
    await result.save();
    await result.populate([
      { path: 'gameId', select: 'name gameType' },
      { path: 'verifiedBy', select: 'username' }
    ]);

    res.json(result);
  } catch (error) {
    console.error('Update result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/results/:id - Delete a result (authenticated)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Result.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    res.json({ message: 'Result deleted successfully' });
  } catch (error) {
    console.error('Delete result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;