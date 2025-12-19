const express = require('express');
const DailyGameResult = require('../models/DailyGameResult');
const Game = require('../models/Game');
const eventEmitter = require('../utils/eventEmitter');
const router = express.Router();

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

const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can perform this action' });
  }
  next();
};

const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

router.post('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { gameId, resultNumber } = req.body;

    if (!gameId || !resultNumber) {
      return res.status(400).json({ error: 'gameId and resultNumber are required' });
    }

    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newResult = new DailyGameResult({
      gameId,
      resultDate: today,
      resultNumber: resultNumber.toString(),
      createdBy: req.user.userId
    });

    await newResult.save();
    await newResult.populate([
      { path: 'gameId', select: 'name nickName gameType' },
      { path: 'createdBy', select: 'username' }
    ]);

    eventEmitter.emit('result-posted', { type: 'result-posted', gameId, resultNumber });

    res.status(201).json(newResult);
  } catch (error) {
    console.error('Create daily result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { gameId, startDate, endDate } = req.query;
    const query = {};

    if (gameId) {
      query.gameId = gameId;
    }

    if (startDate || endDate) {
      query.resultDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.resultDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.resultDate.$lte = end;
      }
    }

    const results = await DailyGameResult.find(query)
      .populate('gameId', 'name nickName gameType')
      .populate('createdBy', 'username')
      .sort({ resultDate: -1, createdAt: -1 });

    res.json(results);
  } catch (error) {
    console.error('Get daily results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/today/:gameId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const results = await DailyGameResult.find({
      gameId,
      resultDate: today
    })
      .populate('gameId', 'name nickName gameType')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    res.json(results);
  } catch (error) {
    console.error('Get today results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { resultNumber } = req.body;

    if (!resultNumber) {
      return res.status(400).json({ error: 'resultNumber is required' });
    }

    const result = await DailyGameResult.findById(id);
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (result.resultDate.getTime() !== today.getTime()) {
      return res.status(403).json({ error: 'Can only edit today\'s results' });
    }

    result.resultNumber = resultNumber.toString();
    await result.save();

    await result.populate([
      { path: 'gameId', select: 'name nickName gameType' },
      { path: 'createdBy', select: 'username' }
    ]);

    res.json(result);
  } catch (error) {
    console.error('Update daily result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await DailyGameResult.findById(id);

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (result.resultDate.getTime() !== today.getTime()) {
      return res.status(403).json({ error: 'Can only delete today\'s results' });
    }

    await DailyGameResult.findByIdAndDelete(id);
    res.json({ message: 'Result deleted successfully' });
  } catch (error) {
    console.error('Delete daily result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
