const express = require('express');
const Result = require('../models/Result');
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

// Get all results
router.get('/', async (req, res) => {
  try {
    const { gameId, limit = 50, page = 1 } = req.query;
    const query = {};
    
    if (gameId) {
      query.gameId = gameId;
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

// Get result by ID
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

// Create new result
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

    // Verify the game exists
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

// Update result
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { result, resultNumbers, winningNumbers, drawDate, prizeDistribution, totalPrizePool, isOfficial } = req.body;
    
    const resultDoc = await Result.findById(id);
    
    if (!resultDoc) {
      return res.status(404).json({ error: 'Result not found' });
    }

    // Only admin can update results
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can update results' });
    }

    // Update result fields
    if (result !== undefined) resultDoc.result = result;
    if (resultNumbers !== undefined) resultDoc.resultNumbers = resultNumbers;
    if (winningNumbers !== undefined) resultDoc.winningNumbers = winningNumbers;
    if (drawDate !== undefined) resultDoc.drawDate = drawDate;
    if (prizeDistribution !== undefined) resultDoc.prizeDistribution = prizeDistribution;
    if (totalPrizePool !== undefined) resultDoc.totalPrizePool = totalPrizePool;
    
    if (isOfficial !== undefined) {
      resultDoc.isOfficial = isOfficial;
      if (isOfficial && !resultDoc.verifiedBy) {
        resultDoc.verifiedBy = req.user.userId;
        resultDoc.verifiedAt = new Date();
      }
    }

    await resultDoc.save();
    await resultDoc.populate([
      { path: 'gameId', select: 'name gameType' },
      { path: 'verifiedBy', select: 'username' }
    ]);

    res.json(resultDoc);
  } catch (error) {
    console.error('Update result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete result
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Result.findById(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    // Only admin can delete results
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can delete results' });
    }

    await Result.findByIdAndDelete(id);
    res.json({ message: 'Result deleted successfully' });
  } catch (error) {
    console.error('Delete result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get latest results for a specific game
router.get('/latest/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { limit = 10 } = req.query;
    
    // Verify the game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
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

// Mark result as official
router.patch('/:id/verify', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await Result.findById(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    // Only admin can verify results
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can verify results' });
    }

    result.isOfficial = true;
    result.verifiedBy = req.user.userId;
    result.verifiedAt = new Date();
    
    await result.save();
    await result.populate([
      { path: 'gameId', select: 'name gameType' },
      { path: 'verifiedBy', select: 'username' }
    ]);

    res.json(result);
  } catch (error) {
    console.error('Verify result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;