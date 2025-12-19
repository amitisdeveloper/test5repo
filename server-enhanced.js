const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/555results';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ Connected to MongoDB:', MONGODB_URI.split('?')[0]))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// Serve static files from backend folder (for the backup API)
app.use('/backup-api', express.static(path.join(__dirname, 'backend')));

// Import routes - New API structure
const loginRouter = require('./api/auth/login');
const gamesRouter = require('./api/games/index');
const resultsRouter = require('./api/results/index');

// Import routes - Legacy structure (for compatibility)
const authRoutes = require('./routes/auth');
const gamesRoutes = require('./routes/games');
const resultsRoutes = require('./routes/results');

// New API routes
app.use('/api/auth', loginRouter);
app.use('/api/games', gamesRouter);
app.use('/api/results', resultsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    version: '2.0.0-enhanced'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: '555 Results API',
    version: '2.0.0',
    status: 'running',
    endpoints: {
      auth: {
        'POST /api/auth/login': 'User login (new)',
        'POST /api/auth/login': 'User login (legacy)',
        'POST /api/auth/register': 'User registration',
        'GET /api/auth/profile': 'Get user profile'
      },
      games: {
        'GET /api/games': 'Get all games (new & legacy)',
        'POST /api/games': 'Create new game',
        'GET /api/games/types': 'Get game types',
        'PUT /api/games/:id': 'Update game',
        'DELETE /api/games/:id': 'Delete game'
      },
      results: {
        'GET /api/results': 'Get all results (new & legacy)',
        'POST /api/results': 'Create new result',
        'GET /api/results/latest/:gameId': 'Get latest results',
        'GET /api/results/stats/:gameId': 'Get result statistics',
        'PUT /api/results/:id': 'Update result',
        'DELETE /api/results/:id': 'Delete result'
      }
    },
    documentation: '/api/docs'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    method: req.method,
    path: req.path,
    availableEndpoints: '/api'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📖 API info: http://localhost:${PORT}/api`);
  console.log(`🔗 Legacy backup API: http://localhost:${PORT}/backup-api`);
});

module.exports = app;