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
  resultTime: {
    type: String,
    trim: true,
    maxlength: 8 // Format: "hh:mm AM/PM"
  },
  resultDate: {
    type: Date,
    default: null
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

// Cascade delete - delete associated results when game is deleted
gameSchema.pre('deleteOne', { document: true }, async function(next) {
  const Result = require('./Result');
  await Result.deleteMany({ gameId: this._id });
  next();
});

gameSchema.pre('findOneAndDelete', async function(next) {
  const Result = require('./Result');
  const doc = await this.model.findOne(this.getFilter());
  if (doc) {
    await Result.deleteMany({ gameId: doc._id });
  }
  next();
});

module.exports = mongoose.model('Game', gameSchema);