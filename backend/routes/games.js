const express = require('express');
const Game = require('../models/Game');
const Result = require('../models/Result');
const GamePublishedResult = require('../models/GamePublishedResult');
const eventEmitter = require('../utils/eventEmitter');
const { getGameDate, getGameDateForTime, formatGameDate, formatGameTime } = require('../utils/timezone');
const router = express.Router();

router.use((req, res, next) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  const jwt = require('jsonwebtoken');
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  console.log('=== VERIFY TOKEN ===');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Token present:', !!token);
  
  if (!token) {
    console.log('NO TOKEN PROVIDED');
    return res.status(401).json({ error: 'Access denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Token decoded:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('Token verification failed:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get all games (public endpoint) with today's result status
router.get('/', async (req, res) => {
  try {
    const { status, gameType } = req.query;
    const query = { isActive: true };
    
    if (status) {
      query.status = status;
    }

    if (gameType) {
      query.gameType = gameType;
    }

    const games = await Game.find(query)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });

    // Get today's game date for result filtering
    const todayGameDate = getGameDate();
    const todayStart = new Date(todayGameDate);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayGameDate);
    todayEnd.setHours(23, 59, 59, 999);

    // Fetch all today's published results from both collections
    const publishedResults = await GamePublishedResult.find({
      publishDate: {
        $gte: todayStart,
        $lte: todayEnd
      }
    }).select('gameId publishedNumber publishDate');

    // Also fetch results from the Result collection for today's date
    const todayGameResults = await Result.find({
      drawDate: {
        $gte: todayStart,
        $lte: todayEnd
      }
    }).select('gameId result drawDate');

    // Create a map of gameId to result for quick lookup from both collections
    const resultMap = {};
    
    // Add published results
    publishedResults.forEach(r => {
      resultMap[r.gameId.toString()] = {
        number: r.publishedNumber,
        date: r.publishDate
      };
    });
    
    // Add regular results (these should also count as having results)
    todayGameResults.forEach(r => {
      if (!resultMap[r.gameId.toString()]) {
        resultMap[r.gameId.toString()] = {
          number: r.result,
          date: r.drawDate
        };
      }
    });

    // Enhance games with result status
    const enhancedGames = games.map(game => {
      const gameObj = game.toObject ? game.toObject() : game;
      gameObj.hasResult = !!resultMap[game._id.toString()];
      if (gameObj.hasResult) {
        gameObj.result = resultMap[game._id.toString()].number;
        gameObj.resultDate = resultMap[game._id.toString()].date;
      }
      return gameObj;
    });

    // Separate games into prime and local categories
    const primeGames = enhancedGames.filter(game => game.gameType === 'prime');
    const localGames = enhancedGames.filter(game => game.gameType === 'local');

    // Separate by result status within each category
    const primeUpcoming = primeGames.filter(g => !g.hasResult);
    const primeWithResults = primeGames.filter(g => g.hasResult);
    const localUpcoming = localGames.filter(g => !g.hasResult);
    const localWithResults = localGames.filter(g => g.hasResult);

    res.json({
      prime: primeGames,
      local: localGames,
      primeUpcoming,
      primeWithResults,
      localUpcoming,
      localWithResults,
      todayGameDate: formatGameDate(todayGameDate)
    });
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to get all games
router.get('/admin', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 9, gameType, search, status } = req.query;
    const query = { isActive: true };
    
    // Add gameType filter
    if (gameType) {
      query.gameType = gameType;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { nickName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Add status filter - ensure isActive: true is always maintained
    if (status) {
      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'completed') {
        // Games that have results
        const gamesWithResults = await Result.distinct('gameId');
        query._id = { $in: gamesWithResults };
        query.isActive = true;
      }
    } else {
      // No status filter provided, still ensure we filter by isActive
      query.isActive = true;
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

    // Add latest result for each game
    const gamesWithResults = await Promise.all(games.map(async (game) => {
      const gameObj = game.toObject();
      const latestResult = await Result.findOne({ gameId: game._id })
        .sort({ createdAt: -1 });
      
      if (latestResult) {
        gameObj.latestResult = {
          result: latestResult.result,
          date: latestResult.createdAt,
          time: latestResult.createdAt.toLocaleTimeString()
        };
      }
      
      return gameObj;
    }));

    res.json({
      games: gamesWithResults,
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

// Get all active games for dropdown (admin endpoint) - MUST come before /:id route
router.get('/admin/active-games', verifyToken, async (req, res) => {
  try {
    const games = await Game.find({ isActive: true })
      .select('_id name nickName gameType isActive')
      .sort({ createdAt: -1 });

    res.json(games);
  } catch (error) {
    console.error('Get active games error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get latest result for any game - MUST come before /:id route
router.get('/latest-result', async (req, res) => {
  try {
    // Get the most recent published result from any game
    const latestResult = await GamePublishedResult.findOne()
      .sort({ createdAt: -1 })
      .populate('gameId', 'nickName gameType');

    if (!latestResult) {
      return res.json(null);
    }

    res.json({
      result: latestResult.publishedNumber,
      name: latestResult.gameId.nickName,
      date: latestResult.publishDate,
      time: formatGameTime(latestResult.publishDate),
      formattedDate: formatGameDate(latestResult.publishDate),
      gameId: latestResult.gameId._id,
      postedAt: latestResult.createdAt
    });
  } catch (error) {
    console.error('Get latest result error:', error);
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
    const { nickName, gameType = 'local', isActive = true } = req.body;

    if (!nickName) {
      return res.status(400).json({ error: 'Game name is required' });
    }

    const newGame = new Game({
      nickName,
      gameType,
      isActive,
      createdBy: req.user.userId
    });

    await newGame.save();
    await newGame.populate('createdBy', 'username email');

    console.log('[GAME] Emitting game-created event:', { gameId: newGame._id, nickName });
    eventEmitter.emit('game-created', { type: 'game-created', gameId: newGame._id, nickName });

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
    const { nickName, gameType, isActive } = req.body;
    
    const game = await Game.findById(id);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Check if user is admin or the creator of the game
    if (req.user.role !== 'admin' && game.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update this game' });
    }

    // Update game fields
    if (nickName) game.nickName = nickName;
    if (gameType) game.gameType = gameType;
    if (isActive !== undefined) game.isActive = isActive;

    await game.save();
    await game.populate('createdBy', 'username email');

    eventEmitter.emit('game-updated', { type: 'game-updated', gameId: game._id, nickName: game.nickName });

    res.json(game);
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete game (soft delete - set isActive to false)
router.delete('/:id', verifyToken, async (req, res) => {
  console.log('\n========== DELETE REQUEST ==========');
  console.log('Time:', new Date().toISOString());
  console.log('Auth Header:', req.header('Authorization') ? 'Present' : 'Missing');
  console.log('User:', req.user);
  
  try {
    const { id } = req.params;
    console.log('Game ID to delete:', id);
    
    if (!id || id.length !== 24) {
      console.log('Invalid game ID format');
      return res.status(400).json({ error: 'Invalid game ID' });
    }

    const game = await Game.findById(id);
    console.log('Game found in DB before delete:', !!game);
    
    if (!game) {
      console.log('Game not found:', id);
      return res.status(404).json({ error: 'Game not found' });
    }

    console.log('Marking game as inactive:', { _id: game._id, name: game.nickName });

    // Use soft delete - set isActive to false instead of physically deleting
    const deletedGame = await Game.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    console.log('Game marked as inactive:', !!deletedGame);
    console.log('isActive after update:', deletedGame?.isActive);

    // Verify the update persisted
    const verifyDelete = await Game.findById(id);
    console.log('Game isActive after verification:', verifyDelete?.isActive);

    console.log('[GAME DELETE] About to emit game-deleted event:', { gameId: id });
    eventEmitter.emit('game-deleted', { type: 'game-deleted', gameId: id });
    console.log('[GAME DELETE] Event emitted successfully');

    console.log('========== DELETE COMPLETE ==========\n');
    res.json({ message: 'Game deleted successfully', gameId: id, deleted: true });
    
  } catch (error) {
    console.error('DELETE ERROR:', error.message);
    console.error('Stack:', error.stack);
    console.log('========== DELETE FAILED ==========\n');
    res.status(500).json({ error: 'Failed to delete game', details: error.message });
  }
});

module.exports = router;
