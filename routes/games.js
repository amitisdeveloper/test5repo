const express = require('express');
const Game = require('../models/Game');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all games
router.get('/', auth, async (req, res) => {
  try {
    const games = await Game.find().populate('createdBy', 'username').sort({ createdAt: -1 });
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new game
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const { name, description } = req.body;

    const game = new Game({
      name,
      description,
      createdBy: req.user.userId
    });

    await game.save();
    res.status(201).json(game);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a game
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { name, description, status } = req.body;

    const game = await Game.findByIdAndUpdate(
      req.params.id,
      { name, description, status },
      { new: true }
    );

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.json(game);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a game
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const game = await Game.findByIdAndDelete(req.params.id);

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
