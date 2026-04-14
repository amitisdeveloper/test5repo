const express = require('express');
const verifyToken = require('../middleware/auth');

const router = express.Router();

const STALE_THRESHOLD_MS = 45 * 1000;
const activeSessions = new Map();

const cleanupExpiredSessions = () => {
  const now = Date.now();

  for (const [sessionId, session] of activeSessions.entries()) {
    if (now - session.lastSeenAt > STALE_THRESHOLD_MS) {
      activeSessions.delete(sessionId);
    }
  }
};

const getActiveUserCount = () => {
  cleanupExpiredSessions();
  return new Set(
    Array.from(activeSessions.values()).map((session) => session.userId)
  ).size;
};

router.get('/count', verifyToken, (req, res) => {
  res.json({
    activeUsers: getActiveUserCount()
  });
});

router.post('/heartbeat', verifyToken, (req, res) => {
  const { sessionId, page } = req.body || {};

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  cleanupExpiredSessions();

  activeSessions.set(sessionId, {
    sessionId,
    userId: req.user.userId,
    username: req.user.username,
    role: req.user.role,
    page: typeof page === 'string' ? page : 'admin-panel',
    lastSeenAt: Date.now()
  });

  res.json({
    activeUsers: getActiveUserCount()
  });
});

router.delete('/heartbeat/:sessionId', verifyToken, (req, res) => {
  const { sessionId } = req.params;
  const session = activeSessions.get(sessionId);

  if (session && session.userId === req.user.userId) {
    activeSessions.delete(sessionId);
  }

  res.json({
    activeUsers: getActiveUserCount()
  });
});

module.exports = router;
