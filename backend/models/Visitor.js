const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  visitorKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  lastCountedAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true,
  // Separate collection from the earlier cookie-based implementation.
  collection: 'ip_visitors'
});

const visitorCounterSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: 'homepage'
  },
  count: {
    type: Number,
    default: 0,
    min: 0
  }
}, { timestamps: true });

module.exports = {
  Visitor: mongoose.model('Visitor', visitorSchema),
  VisitorCounter: mongoose.model('VisitorCounter', visitorCounterSchema)
};
