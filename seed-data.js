const mongoose = require('mongoose');
const Game = require('./models/Game');
const Result = require('./models/Result');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

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

// Sample games data
const sampleGames = [
  {
    name: 'Daily Lottery',
    nickName: 'DL',
    description: 'Daily 3-digit lottery game',
    gameType: 'lottery',
    status: 'active',
    settings: {
      minNumber: 0,
      maxNumber: 9,
      drawCount: 1
    }
  },
  {
    name: 'Prime Game',
    nickName: 'PG',
    description: 'Prime number based lottery game',
    gameType: 'prime',
    status: 'active',
    settings: {
      minNumber: 1,
      maxNumber: 99,
      drawCount: 1
    }
  },
  {
    name: 'Local Draw',
    nickName: 'LD',
    description: 'Local community lottery draw',
    gameType: 'local',
    status: 'active',
    settings: {
      minNumber: 0,
      maxNumber: 9,
      drawCount: 1
    }
  },
  {
    name: 'Lucky Raffle',
    nickName: 'LR',
    description: 'Weekly lucky raffle game',
    gameType: 'raffle',
    status: 'active',
    settings: {
      minNumber: 1,
      maxNumber: 100,
      drawCount: 1
    }
  }
];

// Create or get admin user
async function getOrCreateAdminUser() {
  let adminUser = await User.findOne({ username: 'admin' });
  
  if (!adminUser) {
    adminUser = new User({
      username: 'admin',
      email: 'admin@lottery.com',
      password: 'admin123',
      role: 'admin'
    });
    await adminUser.save();
    console.log('Created admin user');
  }
  
  return adminUser;
}

// Generate random 3-digit result
function generateRandomResult() {
  const left = Math.floor(Math.random() * 10); // 0-9
  const center = Math.floor(Math.random() * 10); // 0-9
  const right = Math.floor(Math.random() * 10); // 0-9
  
  return {
    left,
    center,
    right,
    result: `${left}${center}${right}`,
    resultNumbers: { left, center, right }
  };
}

// Generate specific date at 8:00 PM (typical lottery draw time)
function getDrawDate(dateString) {
  const date = new Date(dateString);
  date.setHours(20, 0, 0, 0); // Set to 8:00 PM
  return date;
}

// Get all dates in range
function getDateRange() {
  const currentDate = new Date('2025-12-06'); // Base date
  
  const dates = [];
  
  // Previous 4 days: Dec 2, 3, 4, 5
  for (let i = 4; i >= 1; i--) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  // Current date (Dec 6)
  dates.push('2025-12-06');
  
  // Next 3 days: Dec 7, 8, 9
  for (let i = 1; i <= 3; i++) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

// Seed data function
async function seedData() {
  try {
    console.log('Starting data seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    // await Game.deleteMany({});
    // await Result.deleteMany({});
    
    // Get or create admin user
    const adminUser = await getOrCreateAdminUser();
    
    // Create sample games
    const createdGames = [];
    for (const gameData of sampleGames) {
      let game = await Game.findOne({ name: gameData.name });
      
      if (!game) {
        game = new Game({
          ...gameData,
          createdBy: adminUser._id
        });
        await game.save();
        createdGames.push(game);
        console.log(`Created game: ${game.name}`);
      } else {
        createdGames.push(game);
        console.log(`Using existing game: ${game.name}`);
      }
    }
    
    // Get date range (7 days total)
    const dateRange = getDateRange();
    console.log(`Seeding data for dates: ${dateRange.join(', ')}`);
    
    // Create results for each game and each date
    let totalResultsCreated = 0;
    
    for (const game of createdGames) {
      for (const dateString of dateRange) {
        // Check if result already exists for this game and date
        const drawDate = getDrawDate(dateString);
        const existingResult = await Result.findOne({
          gameId: game._id,
          drawDate: {
            $gte: new Date(drawDate.setHours(0, 0, 0, 0)),
            $lt: new Date(drawDate.setHours(23, 59, 59, 999))
          }
        });
        
        if (!existingResult) {
          // Generate random result
          const randomResult = generateRandomResult();
          
          // Create prize distribution
          const prizeDistribution = [
            {
              tier: '1st Prize',
              winners: Math.floor(Math.random() * 3) + 1,
              prizeAmount: 50000,
              numbersMatched: 3
            },
            {
              tier: '2nd Prize',
              winners: Math.floor(Math.random() * 10) + 5,
              prizeAmount: 5000,
              numbersMatched: 2
            },
            {
              tier: '3rd Prize',
              winners: Math.floor(Math.random() * 50) + 20,
              prizeAmount: 500,
              numbersMatched: 1
            }
          ];
          
          const totalPrizePool = prizeDistribution.reduce((sum, prize) => 
            sum + (prize.winners * prize.prizeAmount), 0);
          
          // Create result
          const result = new Result({
            gameId: game._id,
            result: randomResult.result,
            resultNumbers: [randomResult.left, randomResult.center, randomResult.right],
            drawDate: getDrawDate(dateString),
            winningNumbers: [randomResult.left, randomResult.center, randomResult.right],
            prizeDistribution,
            totalPrizePool,
            drawNumber: `${game.nickName}-${dateString.replace(/-/g, '')}`,
            isOfficial: true,
            verifiedBy: adminUser._id,
            verifiedAt: getDrawDate(dateString)
          });
          
          await result.save();
          totalResultsCreated++;
          
          console.log(`Created result for ${game.name} on ${dateString}: ${randomResult.result}`);
        } else {
          console.log(`Result already exists for ${game.name} on ${dateString}: ${existingResult.result}`);
        }
      }
    }
    
    console.log(`\nSeeding completed successfully!`);
    console.log(`- Created ${createdGames.length} games`);
    console.log(`- Created ${totalResultsCreated} new results`);
    console.log(`- Total games in database: ${await Game.countDocuments()}`);
    console.log(`- Total results in database: ${await Result.countDocuments()}`);
    
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedData();
}

module.exports = { seedData, getDateRange, generateRandomResult };