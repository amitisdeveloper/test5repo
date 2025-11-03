const express = require('express');
const Result = require('../models/Result');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/results - Get all results
router.get('/', async (req, res) => {
  try {
    const results = await Result.find().sort({ createdAt: -1 });
    res.json(results);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/results - Create a new result (authenticated)
router.post('/', auth, async (req, res) => {
  try {
    const result = new Result(req.body);
    await result.save();
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating result:', error);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// PUT /api/results/:id - Update a result (authenticated)
router.put('/:id', auth, async (req, res) => {
  try {
    const result = await Result.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }
    res.json(result);
  } catch (error) {
    console.error('Error updating result:', error);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// DELETE /api/results/:id - Delete a result (authenticated)
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await Result.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }
    res.json({ message: 'Result deleted successfully' });
  } catch (error) {
    console.error('Error deleting result:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/results/publish - Publish result for a game (authenticated)
router.post('/publish', auth, async (req, res) => {
  try {
    const { gameId, left, center, right } = req.body;

    if (!gameId || !left || !center || !right) {
      return res.status(400).json({ error: 'Game ID and all result numbers are required' });
    }

    // Find the game to get its name
    const Game = require('../models/Game');
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Create result
    const result = new Result({
      name: game.nickName,
      time: game.endTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      left,
      center,
      right,
      result: `${left}${center}${right}`
    });

    await result.save();
    res.status(201).json(result);
  } catch (error) {
    console.error('Error publishing result:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
