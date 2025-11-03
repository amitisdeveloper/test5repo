const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  time: {
    type: String,
    required: true
  },
  left: {
    type: String,
    default: null
  },
  center: {
    type: String,
    default: null
  },
  right: {
    type: String,
    default: null
  },
  result: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Result', resultSchema);
