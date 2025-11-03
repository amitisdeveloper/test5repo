const express = require('express');
const Game = require('../models/Game');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/games - Get all games (prime and local)
router.get('/', async (req, res) => {
  try {
    const primeGames = await Game.find({ gameType: 'prime', isActive: true }).sort({ startTime: 1 });
    const localGames = await Game.find({ gameType: 'local', isActive: true }).sort({ startTime: 1 });

    res.json({
      prime: primeGames,
      local: localGames
    });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/games/admin - Get all games for admin (authenticated)
router.get('/admin', auth, async (req, res) => {
  try {
    const games = await Game.find().sort({ createdAt: -1 });
    res.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/games - Create a new game (authenticated)
router.post('/', auth, async (req, res) => {
  try {
    const game = new Game(req.body);
    await game.save();
    res.status(201).json(game);
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// PUT /api/games/:id - Update a game (authenticated)
router.put('/:id', auth, async (req, res) => {
  try {
    const game = await Game.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    console.error('Error updating game:', error);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// DELETE /api/games/:id - Delete a game (authenticated)
router.delete('/:id', auth, async (req, res) => {
  try {
    const game = await Game.findByIdAndDelete(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Error deleting game:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
