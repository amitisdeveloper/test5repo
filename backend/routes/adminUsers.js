const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const verifyToken = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

const USER_ID_PREFIX = 'RU';
const USER_ID_WIDTH = 3;
const MANAGED_USER_ROLES = ['subadmin', 'user'];

const normalizePhoneNumber = (value = '') => value.replace(/\D/g, '');
const normalizeUsername = (value = '') => String(value).trim();

const generatePassword = () => `${Math.floor(100000 + Math.random() * 900000)}`;

const buildUserId = (sequence) => `${USER_ID_PREFIX}${String(sequence).padStart(USER_ID_WIDTH, '0')}`;
const getDuplicateField = (error) => {
  if (!error || error.code !== 11000) {
    return null;
  }

  if (error.keyPattern) {
    return Object.keys(error.keyPattern)[0] || null;
  }

  if (error.keyValue) {
    return Object.keys(error.keyValue)[0] || null;
  }

  return null;
};

const getNextUserId = async () => {
  const users = await User.find({
    role: { $in: MANAGED_USER_ROLES },
    userId: { $regex: `^${USER_ID_PREFIX}\\d+$` }
  })
    .select('userId')
    .lean();

  const maxSequence = users.reduce((max, user) => {
    const sequence = parseInt(String(user.userId || '').replace(USER_ID_PREFIX, ''), 10);
    if (Number.isNaN(sequence)) {
      return max;
    }

    return Math.max(max, sequence);
  }, 0);

  return buildUserId(maxSequence + 1);
};

const syncAssignedGames = async (userId, assignedGameIds = []) => {
  const normalizedIds = [...new Set(
    assignedGameIds
      .filter(Boolean)
      .map((id) => id.toString())
  )];

  const Game = require('../models/Game');

  await Game.updateMany(
    { assignedUsers: userId },
    { $pull: { assignedUsers: userId } }
  );

  if (normalizedIds.length) {
    await Game.updateMany(
      { _id: { $in: normalizedIds } },
      { $addToSet: { assignedUsers: userId } }
    );
  }
};

const withAssignedGames = async (users) => {
  const Game = require('../models/Game');
  const list = Array.isArray(users) ? users : [users];
  const userIds = list.map((user) => user?._id).filter(Boolean);

  if (!userIds.length) {
    return Array.isArray(users) ? [] : null;
  }

  const games = await Game.find({ assignedUsers: { $in: userIds } })
    .select('_id name nickName assignedUsers')
    .lean();

  const gameMap = new Map();
  games.forEach((game) => {
    (game.assignedUsers || []).forEach((assignedUserId) => {
      const key = assignedUserId.toString();
      if (!gameMap.has(key)) {
        gameMap.set(key, []);
      }
      gameMap.get(key).push({
        _id: game._id,
        name: game.name,
        nickName: game.nickName
      });
    });
  });

  const enriched = list.map((user) => {
    const plainUser = user.toObject ? user.toObject() : { ...user };
    plainUser.assignedGames = gameMap.get(user._id.toString()) || [];
    return plainUser;
  });

  return Array.isArray(users) ? enriched : enriched[0];
};

router.use(verifyToken, requireAdmin);

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
    const query = { role: { $in: MANAGED_USER_ROLES } };

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const trimmedSearch = String(search || '').trim();
    if (trimmedSearch) {
      query.$or = [
        { name: { $regex: trimmedSearch, $options: 'i' } },
        { phoneNumber: { $regex: trimmedSearch, $options: 'i' } },
        { userId: { $regex: trimmedSearch, $options: 'i' } },
        { username: { $regex: trimmedSearch, $options: 'i' } }
      ];
    }

    const totalItems = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('createdBy', 'username name');

    const usersWithAssignments = await withAssignedGames(users);

    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    res.json({
      users: usersWithAssignments,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        itemsPerPage: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/next-credentials', async (req, res) => {
  try {
    const userId = await getNextUserId();
    const generatedPassword = generatePassword();

    res.json({
      userId,
      username: userId,
      password: generatedPassword
    });
  } catch (error) {
    console.error('Get next credentials error:', error);
    res.status(500).json({ error: 'Unable to generate credentials' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: { $in: MANAGED_USER_ROLES } })
      .select('-password')
      .populate('createdBy', 'username name');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(await withAssignedGames(user));
  } catch (error) {
    console.error('Get admin user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const phoneNumber = normalizePhoneNumber(req.body.phoneNumber || '');
    const username = normalizeUsername(req.body.username || '');
    const password = String(req.body.password || '').trim();
    const assignedGameIds = Array.isArray(req.body.assignedGameIds) ? req.body.assignedGameIds : [];

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (phoneNumber.length < 10) {
      return res.status(400).json({ error: 'Phone number must be at least 10 digits' });
    }

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingPhone = await User.findOne({ phoneNumber, role: { $in: MANAGED_USER_ROLES } }).select('_id');
    if (existingPhone) {
      return res.status(400).json({ error: 'Phone number already exists' });
    }

    const existingUsername = await User.findOne({ username }).select('_id');
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    let createdUser = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const userId = await getNextUserId();

      try {
        createdUser = await User.create({
          name,
          phoneNumber,
          userId,
          username,
          password,
          role: 'subadmin',
          isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
          createdBy: req.user.userId
        });
        await syncAssignedGames(createdUser._id, assignedGameIds);
        break;
      } catch (error) {
        const duplicateField = getDuplicateField(error);

        if (duplicateField === 'userId') {
          continue;
        }

        throw error;
      }
    }

    if (!createdUser) {
      return res.status(500).json({ error: 'Unable to create user right now. Please retry.' });
    }

    const responseUser = await User.findById(createdUser._id)
      .select('-password')
      .populate('createdBy', 'username name');
    const enrichedUser = await withAssignedGames(responseUser);

    res.status(201).json({
      message: 'User created successfully',
      user: enrichedUser,
      credentials: {
        userId: enrichedUser.userId,
        username: enrichedUser.username,
        password
      }
    });
  } catch (error) {
    console.error('Create admin user error:', error);
    if (error.code === 11000) {
      const duplicateField = getDuplicateField(error);
      if (duplicateField === 'username') {
        return res.status(400).json({ error: 'Username already exists' });
      }

      if (duplicateField === 'phoneNumber') {
        return res.status(400).json({ error: 'Phone number already exists' });
      }

      if (duplicateField === 'email') {
        return res.status(400).json({ error: 'Email index conflict. Existing database index needs migration.' });
      }

      if (duplicateField === 'userId') {
        return res.status(400).json({ error: 'User ID already exists. Please retry.' });
      }

      return res.status(400).json({ error: 'A user with these details already exists' });
    }

    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: { $in: MANAGED_USER_ROLES } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const name = req.body.name !== undefined ? String(req.body.name).trim() : user.name;
    const phoneNumber = req.body.phoneNumber !== undefined
      ? normalizePhoneNumber(req.body.phoneNumber)
      : user.phoneNumber;
    const username = req.body.username !== undefined
      ? normalizeUsername(req.body.username)
      : user.username;
    const password = req.body.password !== undefined
      ? String(req.body.password).trim()
      : '';
    const assignedGameIds = Array.isArray(req.body.assignedGameIds) ? req.body.assignedGameIds : [];

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (phoneNumber.length < 10) {
      return res.status(400).json({ error: 'Phone number must be at least 10 digits' });
    }

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
    }

    if (password && password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingPhone = await User.findOne({
      _id: { $ne: user._id },
      role: { $in: MANAGED_USER_ROLES },
      phoneNumber
    }).select('_id');

    if (existingPhone) {
      return res.status(400).json({ error: 'Phone number already exists' });
    }

    const existingUsername = await User.findOne({
      _id: { $ne: user._id },
      username
    }).select('_id');

    if (existingUsername) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    user.name = name;
    user.phoneNumber = phoneNumber;
    user.username = username;

    if (req.body.isActive !== undefined) {
      user.isActive = Boolean(req.body.isActive);
    }

    if (user.role === 'user') {
      user.role = 'subadmin';
    }

    let generatedPassword = null;
    if (req.body.regeneratePassword) {
      generatedPassword = generatePassword();
      user.password = generatedPassword;
    } else if (password) {
      generatedPassword = password;
      user.password = password;
    }

    await user.save();
    await syncAssignedGames(user._id, assignedGameIds);

    const responseUser = await User.findById(user._id)
      .select('-password')
      .populate('createdBy', 'username name');
    const enrichedUser = await withAssignedGames(responseUser);

    res.json({
      message: 'User updated successfully',
      user: enrichedUser,
      credentials: generatedPassword ? {
        userId: enrichedUser.userId,
        username: enrichedUser.username,
        password: generatedPassword
      } : null
    });
  } catch (error) {
    console.error('Update admin user error:', error);
    if (error.code === 11000) {
      const duplicateField = getDuplicateField(error);
      if (duplicateField === 'username') {
        return res.status(400).json({ error: 'Username already exists' });
      }

      if (duplicateField === 'phoneNumber') {
        return res.status(400).json({ error: 'Phone number already exists' });
      }

      if (duplicateField === 'email') {
        return res.status(400).json({ error: 'Email index conflict. Existing database index needs migration.' });
      }

      return res.status(400).json({ error: 'A user with these details already exists' });
    }

    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deletedUser = await User.findOneAndDelete({ _id: req.params.id, role: { $in: MANAGED_USER_ROLES } });

    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    await syncAssignedGames(deletedUser._id, []);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete admin user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
