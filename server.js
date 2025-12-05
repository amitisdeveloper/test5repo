const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/555-results';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const gamesRoutes = require('./routes/games');
const resultsRoutes = require('./routes/results');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/results', resultsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;