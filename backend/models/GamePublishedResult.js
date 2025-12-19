const mongoose = require('mongoose');

const gamePublishedResultSchema = new mongoose.Schema({
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  publishDate: {
    type: Date,
    required: true
  },
  publishedNumber: {
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

// Unique compound index to enforce one result per game per day
gamePublishedResultSchema.index({ gameId: 1, publishDate: 1 }, { unique: true });

// Index for efficient queries
gamePublishedResultSchema.index({ publishDate: -1 });
gamePublishedResultSchema.index({ gameId: 1, publishDate: -1 });

module.exports = mongoose.model('GamePublishedResult', gamePublishedResultSchema);
