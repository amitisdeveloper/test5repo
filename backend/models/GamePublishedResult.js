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
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  auditTrail: [{
    action: {
      type: String,
      enum: ['created', 'updated'],
      required: true
    },
    previousValue: {
      type: String,
      default: null
    },
    newValue: {
      type: String,
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Unique compound index to enforce one result per game per day
gamePublishedResultSchema.index({ gameId: 1, publishDate: 1 }, { unique: true });

// Index for efficient queries
gamePublishedResultSchema.index({ publishDate: -1 });
gamePublishedResultSchema.index({ gameId: 1, publishDate: -1 });

module.exports = mongoose.model('GamePublishedResult', gamePublishedResultSchema);
