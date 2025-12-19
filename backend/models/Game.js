const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxlength: 100
  },
  nickName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed', 'suspended'],
    default: 'active'
  },
  gameType: {
    type: String,
    enum: ['lottery', 'draw', 'raffle', 'other', 'prime', 'local'],
    default: 'lottery'
  },
  drawTime: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    minNumber: { type: Number, default: 1 },
    maxNumber: { type: Number, default: 100 },
    drawCount: { type: Number, default: 1 },
    prizeStructure: { type: mongoose.Schema.Types.Mixed }
  }
}, {
  timestamps: true
});

// Index for efficient queries
gameSchema.index({ status: 1, isActive: 1 });
gameSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Game', gameSchema);