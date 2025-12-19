const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from database to ensure they still exist and are active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token or user deactivated' });
    }

    req.user = {
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ error: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token expired' });
    } else {
      console.error('Auth middleware error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

// Middleware for admin-only routes
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Middleware for owner or admin access
const requireOwnerOrAdmin = (resourceUserIdField = 'createdBy') => {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Check if user owns the resource
      const resourceUserId = req.body[resourceUserIdField] || req.params[resourceUserIdField];
      if (resourceUserId && resourceUserId.toString() === req.user.userId.toString()) {
        return next();
      }
      
      res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    } catch (error) {
      console.error('Owner/Admin middleware error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
};

module.exports = {
  auth,
  requireAdmin,
  requireOwnerOrAdmin
};