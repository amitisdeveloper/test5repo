const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const router = express.Router();

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/create-admin', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin user already exists' });
    }

    const adminUser = new User({
      username: username || 'admin',
      password: password || 'admin123',
      email: email || 'admin@example.com',
      role: 'admin'
    });

    await adminUser.save();

    res.status(201).json({ message: 'Admin user created successfully' });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;