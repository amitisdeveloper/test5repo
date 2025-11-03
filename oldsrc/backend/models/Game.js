const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  nickName: {
    type: String,
    required: true,
    trim: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  gameType: {
    type: String,
    enum: ['prime', 'local'],
    required: true
  }
}, {
  timestamps: true
});

// Virtual for status based on current time
gameSchema.virtual('status').get(function() {
  const now = new Date();
  if (now < this.startTime) {
    return 'coming soon';
  } else if (now >= this.startTime && now <= this.endTime) {
    return 'live';
  } else {
    return 'ended';
  }
});

// Ensure virtual fields are serialized
gameSchema.set('toJSON', { virtuals: true });
gameSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Game', gameSchema);
