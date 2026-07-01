const crypto = require('crypto');
const express = require('express');
const { Visitor, VisitorCounter } = require('../models/Visitor');
const verifyToken = require('../middleware/auth');

const router = express.Router();
const WINDOW_MS = 24 * 60 * 60 * 1000;
const COUNTER_ID = 'homepage-ip-v1';

const getVisitorSecret = () => process.env.VISITOR_HASH_SECRET
  || process.env.JWT_SECRET
  || 'development-only-visitor-secret';

router.post('/visit', async (req, res, next) => {
  try {
    // Express resolves req.ip through only the explicitly trusted reverse proxies.
    // Normalize IPv4-mapped IPv6 so ::ffff:127.0.0.1 and 127.0.0.1 are identical.
    const clientIp = String(req.ip || req.socket?.remoteAddress || 'unknown')
      .trim()
      .toLowerCase()
      .replace(/^::ffff:/, '');
    const visitorKey = crypto
      .createHmac('sha256', getVisitorSecret())
      .update(clientIp)
      .digest('hex');
    const now = new Date();
    const cutoff = new Date(now.getTime() - WINDOW_MS);
    let counted = false;

    try {
      const claim = await Visitor.updateOne(
        {
          visitorKey,
          $or: [
            { lastCountedAt: { $lte: cutoff } },
            { lastCountedAt: { $exists: false } }
          ]
        },
        { $set: { lastCountedAt: now } },
        { upsert: true }
      );
      counted = claim.upsertedCount === 1 || claim.modifiedCount === 1;
    } catch (error) {
      // A duplicate-key error means another concurrent request already claimed the visit.
      if (error?.code !== 11000) throw error;
    }

    if (counted) {
      await VisitorCounter.findByIdAndUpdate(
          COUNTER_ID,
          { $inc: { count: 1 } },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        ).lean();
    }

    res.set('Cache-Control', 'no-store');
    res.json({ counted });
  } catch (error) {
    next(error);
  }
});

router.get('/count', verifyToken, async (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const counter = await VisitorCounter.findById(COUNTER_ID).lean();
    res.set('Cache-Control', 'no-store');
    res.json({ count: counter?.count || 0 });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
