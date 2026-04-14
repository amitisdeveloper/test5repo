const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
process.env.TZ = 'Asia/Kolkata';

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
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from dist (React build)
app.use(express.static(path.join(__dirname, 'dist')));

// Import routes
const authRoutes = require('./backend/routes/auth');
const gamesRoutes = require('./backend/routes/games');
const resultsRoutes = require('./backend/routes/results');
const gameResultsRoutes = require('./backend/routes/gameResults');
const dailyGameResultsRoutes = require('./backend/routes/dailyGameResults');
const adminUsersRoutes = require('./backend/routes/adminUsers');
const adminPresenceRoutes = require('./backend/routes/adminPresence');
const { router: eventsRoutes } = require('./backend/routes/events');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/admin/game-results', gameResultsRoutes);
app.use('/api/admin/daily-results', dailyGameResultsRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/presence', adminPresenceRoutes);
app.use('/api/events', eventsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: '555 Results API',
    version: '2.0.0',
    status: 'running'
  });
});

// Catch all - serve React app for frontend routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error' 
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
