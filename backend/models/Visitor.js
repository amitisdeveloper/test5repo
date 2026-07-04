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
  },
  lastPeriodKey: {
    type: String,
    index: true
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
  },
  periodKey: {
    type: String,
    required: true,
    index: true
  },
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  }
}, { timestamps: true });

module.exports = {
  Visitor: mongoose.model('Visitor', visitorSchema),
  VisitorCounter: mongoose.model('VisitorCounter', visitorCounterSchema)
};
