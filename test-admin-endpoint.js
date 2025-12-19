const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Game = require('./models/Game');

async function testAdminEndpoint() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/555-results', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB\n');

    console.log('=== Games Collection Statistics ===');
    const totalGames = await Game.countDocuments();
    console.log('Total games in collection:', totalGames);

    console.log('\n=== Sample of first 3 games ===');
    const sampleGames = await Game.find().limit(3);
    sampleGames.forEach((game, index) => {
      console.log(`\nGame ${index + 1}:`);
      console.log('  _id:', game._id);
      console.log('  name:', game.name);
      console.log('  gameType:', game.gameType);
      console.log('  createdAt:', game.createdAt);
      console.log('  isActive:', game.isActive);
    });

    console.log('\n=== Simulating Admin Endpoint Query ===');
    const query = {};
    const pageNum = 1;
    const limitNum = 9;
    const skip = (pageNum - 1) * limitNum;

    const games = await Game.find(query)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);

    const total = await Game.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    console.log('Query:', JSON.stringify(query));
    console.log('Results returned:', games.length);
    console.log('Total matching query:', total);
    console.log('Total pages:', pages);

    if (games.length > 0) {
      console.log('\nFirst game returned:');
      console.log(JSON.stringify(games[0], null, 2));
    }

    console.log('\n=== Check Field Existence ===');
    const fieldsCheck = await Game.findOne();
    if (fieldsCheck) {
      console.log('Sample game has these fields:', Object.keys(fieldsCheck.toObject()).sort());
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testAdminEndpoint();
