oconst express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/555results')
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
const authRouter = require('./routes/auth');
const gamesRouter = require('./routes/games');
const resultsRouter = require('./routes/results');

app.use('/api/auth', authRouter);
app.use('/api/games', gamesRouter);
app.use('/api/results', resultsRouter);

app.get('/', (req, res) => {
  res.json({ message: '555 Results Backend API' });
});

// For Vercel serverless deployment
module.exports = app;

// For local development
if (require.main === module) {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
