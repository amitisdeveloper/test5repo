const express = require('express');
const Result = require('../models/Result');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all results
router.get('/', auth, async (req, res) => {
  try {
    const results = await Result.find()
      .populate('game', 'name')
      .populate('createdBy', 'username')
      .sort({ date: -1 });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get results for a specific game
router.get('/game/:gameId', auth, async (req, res) => {
  try {
    const results = await Result.find({ game: req.params.gameId })
      .populate('game', 'name')
      .sort({ date: -1 });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new result
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const { game, numbers } = req.body;

    const result = new Result({
      game,
      numbers,
      createdBy: req.user.userId
    });

    await result.save();
    await result.populate('game', 'name');
    res.status(201).json(result);
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Update a result
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { numbers } = req.body;

    const result = await Result.findByIdAndUpdate(
      req.params.id,
      { numbers },
      { new: true }
    ).populate('game', 'name');

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    res.json(result);
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Delete a result
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const result = await Result.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    res.json({ message: 'Result deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
