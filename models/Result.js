const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  numbers: {
    type: [Number],
    required: true,
    validate: {
      validator: function(v) {
        return v.length === 3 && v.every(num => num >= 0 && num <= 9);
      },
      message: 'Result must contain exactly 3 numbers between 0 and 9'
    }
  },
  date: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Result', resultSchema);
