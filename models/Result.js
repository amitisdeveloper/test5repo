const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  result: {
    type: String,
    required: true,
    trim: true
  },
  resultNumbers: [{
    type: Number
  }],
  drawDate: {
    type: Date,
    default: Date.now
  },
  winningNumbers: [{
    type: Number
  }],
  prizeDistribution: [{
    tier: String,
    winners: Number,
    prizeAmount: Number,
    numbersMatched: Number
  }],
  totalPrizePool: {
    type: Number,
    default: 0
  },
  drawNumber: {
    type: String,
    trim: true
  },
  isOfficial: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
resultSchema.index({ gameId: 1, drawDate: -1 });
resultSchema.index({ drawDate: -1 });
resultSchema.index({ isOfficial: 1 });

// Virtual for formatted draw date
resultSchema.virtual('formattedDrawDate').get(function() {
  return this.drawDate.toISOString().split('T')[0];
});

module.exports = mongoose.model('Result', resultSchema);