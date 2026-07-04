const crypto = require('crypto');
const express = require('express');
const { Visitor, VisitorCounter } = require('../models/Visitor');
const verifyToken = require('../middleware/auth');

const router = express.Router();
const COUNTER_ID = 'homepage-ip-v1';
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const DAY_START_HOUR = 10;

const getVisitorPeriod = (now = new Date()) => {
  const shifted = new Date(now.getTime() + IST_OFFSET_MS - DAY_START_HOUR * 60 * 60 * 1000);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const day = shifted.getUTCDate();
  const periodKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const periodStart = new Date(Date.UTC(year, month, day, DAY_START_HOUR) - IST_OFFSET_MS);
  const periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000);
  return { periodKey, periodStart, periodEnd };
};

const getCounterId = (periodKey) => `${COUNTER_ID}:${periodKey}`;

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
    const period = getVisitorPeriod(now);
    let counted = false;

    try {
      const claim = await Visitor.updateOne(
        {
          visitorKey,
          lastPeriodKey: { $ne: period.periodKey }
        },
        { $set: { lastCountedAt: now, lastPeriodKey: period.periodKey } },
        { upsert: true }
      );
      counted = claim.upsertedCount === 1 || claim.modifiedCount === 1;
    } catch (error) {
      // A duplicate-key error means another concurrent request already claimed the visit.
      if (error?.code !== 11000) throw error;
    }

    if (counted) {
      await VisitorCounter.findByIdAndUpdate(
          getCounterId(period.periodKey),
          {
            $inc: { count: 1 },
            $setOnInsert: {
              periodKey: period.periodKey,
              periodStart: period.periodStart,
              periodEnd: period.periodEnd
            }
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        ).lean();
    }

    res.set('Cache-Control', 'no-store');
    res.json({ counted, periodKey: period.periodKey });
  } catch (error) {
    next(error);
  }
});

router.get('/count', verifyToken, async (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const period = getVisitorPeriod();
    const counter = await VisitorCounter.findById(getCounterId(period.periodKey)).lean();
    res.set('Cache-Control', 'no-store');
    res.json({ count: counter?.count || 0, ...period });
  } catch (error) {
    next(error);
  }
});

router.get('/report', verifyToken, async (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    const startDate = typeof req.query.startDate === 'string' && datePattern.test(req.query.startDate)
      ? req.query.startDate
      : null;
    const endDate = typeof req.query.endDate === 'string' && datePattern.test(req.query.endDate)
      ? req.query.endDate
      : null;
    if (startDate && endDate && startDate > endDate) {
      return res.status(400).json({ error: 'startDate must be before or equal to endDate' });
    }

    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 366) : 30;
    const currentPeriod = getVisitorPeriod();
    const periodKeyFilter = { $exists: true };
    if (startDate) periodKeyFilter.$gte = startDate;
    if (endDate) periodKeyFilter.$lte = endDate;
    const counters = await VisitorCounter.find({ periodKey: periodKeyFilter })
      .sort({ periodStart: -1 })
      .limit(limit)
      .lean();
    const currentIsInRange = (!startDate || currentPeriod.periodKey >= startDate)
      && (!endDate || currentPeriod.periodKey <= endDate);
    const report = currentIsInRange && !counters.some((item) => item.periodKey === currentPeriod.periodKey)
      ? [{ _id: getCounterId(currentPeriod.periodKey), count: 0, ...currentPeriod }, ...counters].slice(0, limit)
      : counters;

    res.set('Cache-Control', 'no-store');
    res.json({ report, filters: { startDate, endDate, limit } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
module.exports.getVisitorPeriod = getVisitorPeriod;
