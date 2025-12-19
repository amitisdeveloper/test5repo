const mongoose = require('mongoose');

const dailyGameResultSchema = new mongoose.Schema({
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  resultDate: {
    type: Date,
    required: true
  },
  resultNumber: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient queries - allows multiple results per game per day
dailyGameResultSchema.index({ gameId: 1, resultDate: 1, createdAt: -1 });
dailyGameResultSchema.index({ resultDate: -1 });
dailyGameResultSchema.index({ gameId: 1, resultDate: -1 });

module.exports = mongoose.model('DailyGameResult', dailyGameResultSchema);
