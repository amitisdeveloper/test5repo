const mongoose = require('mongoose');
const Game = require('./models/Game');
const Result = require('./models/Result');
const User = require('./models/User');

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/555results';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Check today's data specifically
async function checkTodayData() {
  try {
    await connectDB();
    
    const today = new Date('2025-12-06');
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    console.log('=== TODAY\'S DATA (2025-12-06) ===');
    
    // Get today's results
    const todayResults = await Result.find({
      drawDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
    .populate('gameId', 'name nickName gameType')
    .populate('verifiedBy', 'username')
    .sort({ drawDate: -1 });
    
    console.log(`\nTotal results for today: ${todayResults.length}`);
    
    if (todayResults.length > 0) {
      console.log('\n--- Today\'s Results ---');
      todayResults.forEach((result, index) => {
        console.log(`${index + 1}. ${result.gameId.name} (${result.gameId.nickName})`);
        console.log(`   Result: ${result.result}`);
        console.log(`   Numbers: [${result.resultNumbers.join(', ')}]`);
        console.log(`   Draw Time: ${result.drawDate.toISOString()}`);
        console.log(`   Prize Pool: $${result.totalPrizePool.toLocaleString()}`);
        console.log(`   Official: ${result.isOfficial ? 'Yes' : 'No'}`);
        console.log(`   Verified by: ${result.verifiedBy ? result.verifiedBy.username : 'N/A'}`);
        console.log('');
      });
    }
    
    // Get games that have today's data
    const gamesWithTodayData = await Game.find({
      _id: { $in: todayResults.map(r => r.gameId._id) }
    });
    
    console.log(`Games with today's data: ${gamesWithTodayData.length}`);
    gamesWithTodayData.forEach(game => {
      console.log(`- ${game.name} (${game.gameType})`);
    });
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Date: December 6, 2025 (Today)`);
    console.log(`Results seeded: ${todayResults.length}`);
    console.log(`Games with results: ${gamesWithTodayData.length}`);
    
  } catch (error) {
    console.error('Error checking today\'s data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run check if called directly
if (require.main === module) {
  checkTodayData();
}

module.exports = { checkTodayData };