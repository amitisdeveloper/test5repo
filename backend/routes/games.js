const express = require('express');
const Game = require('../models/Game');
const Result = require('../models/Result');
const GamePublishedResult = require('../models/GamePublishedResult');
const eventEmitter = require('../utils/eventEmitter');
const { 
  getGameDate, 
  getCurrentGameDayIST,
  startOfDayIST,
  endOfDayIST,
  getGameDateIST,
  getGameDateForTime, 
  formatGameDate, 
  formatGameTime,
  getGameDayStart,
  getGameDayEnd,
  getTodayDateIST,
  getTodayDateStringIST,
  getTodayDateStringIST_YYYYMMDD
} = require('../utils/timezone');
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
    // 🔍 BACKEND TIMEZONE DEBUG
    console.log('🕒 === BACKEND GAMES API TIMEZONE DEBUG ===');
    console.log('Request from:', req.ip);
    console.log('Server Time (UTC):', new Date().toISOString());
    console.log('Server Time (Local):', new Date().toLocaleString());
    
    const { status } = req.query;
    const query = { isActive: true };

    if (status) {
      query.status = status;
    }

    const games = await Game.find(query)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });

    console.log(`[Games API] Found ${games.length} active games`);

    // Use single IST day boundary for all filtering
    const todayGameDate = getCurrentGameDayIST();
    const todayStart = startOfDayIST();
    const todayEnd = endOfDayIST();

    console.log(`[Games API] Filtering results between: ${todayStart.toISOString()} and ${todayEnd.toISOString()}`);

    const publishedResults = await GamePublishedResult.find({
      publishDate: {
        $gte: todayStart,
        $lte: todayEnd
      }
    }).select('gameId publishedNumber publishDate');

    console.log(`[Games API] Found ${publishedResults.length} published results for today`);

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

    res.json({
      games: enhancedGames,
      upcomingGames: enhancedGames.filter(g => !g.hasResult),
      gamesWithResults: enhancedGames.filter(g => g.hasResult),
      todayGameDate: formatGameDate(todayGameDate),
      todayDateIST: getTodayDateStringIST(),
      todayDateIST_YYYYMMDD: getTodayDateStringIST_YYYYMMDD(),
      filteringRange: {
        start: todayStart.toISOString(),
        end: todayEnd.toISOString()
      }
    });
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to get all games
router.get('/admin', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 9, search, status } = req.query;
    const query = { isActive: true };

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
      .select('_id name nickName isActive')
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
      .populate('gameId', 'nickName resultTime');

    if (!latestResult || !latestResult.gameId) {
      console.log('[Latest Result] No result found or game associated with result was deleted');
      return res.json(null);
    }

    res.json({
      result: latestResult.publishedNumber,
      name: latestResult.gameId.nickName || 'Unknown Game',
      date: latestResult.publishDate,
      time: latestResult.gameId.resultTime || '02:00 PM',
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
    const { nickName, isActive = true, resultTime, resultDate } = req.body;

    console.log('🕒 === CREATE GAME DEBUG ===');
    console.log('Request body:', req.body);
    console.log('nickName:', nickName);
    console.log('resultTime:', resultTime);
    console.log('resultDate:', resultDate);
    console.log('resultDate type:', typeof resultDate);
    console.log('🕒 =========================');

    if (!nickName) {
      return res.status(400).json({ error: 'Game name is required' });
    }

    const newGame = new Game({
      nickName,
      isActive,
      resultTime,
      resultDate: resultDate ? new Date(resultDate) : null,
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
    const { nickName, isActive, resultTime, resultDate } = req.body;
    
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
    if (isActive !== undefined) game.isActive = isActive;
    if (resultTime !== undefined) game.resultTime = resultTime;
    if (resultDate !== undefined) game.resultDate = resultDate ? new Date(resultDate) : null;

    await game.save();
    await game.populate('createdBy', 'username email');

    eventEmitter.emit('game-updated', { type: 'game-updated', gameId: game._id, nickName: game.nickName });

    res.json(game);
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete game (soft delete - set isActive to false, and delete associated results)
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

    // Delete all results associated with this game
    console.log('Deleting results for game:', id);
    const deleteResult = await Result.deleteMany({ gameId: id });
    console.log('Results deleted:', deleteResult.deletedCount);

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
    res.json({ message: 'Game and associated results deleted successfully', gameId: id, deleted: true, resultsDeleted: deleteResult.deletedCount });
    
  } catch (error) {
    console.error('DELETE ERROR:', error.message);
    console.error('Stack:', error.stack);
    console.log('========== DELETE FAILED ==========\n');
    res.status(500).json({ error: 'Failed to delete game', details: error.message });
  }
});

module.exports = router;
