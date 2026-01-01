/**
 * Debug script to check database schema and field mapping
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import the actual Game model from the backend
const Game = require('./backend/models/Game');

async function debugDatabaseSchema() {
  try {
    console.log('🔍 Debugging Database Schema and Field Mapping...\n');

    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/555results';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected');

    // Check the schema
    console.log('\n1. Checking Game Model Schema...');
    const schema = Game.schema.paths;
    console.log('Available fields in schema:');
    Object.keys(schema).forEach(field => {
      console.log(`  - ${field}: ${schema[field].instance} ${schema[field].options ? JSON.stringify(schema[field].options) : ''}`);
    });

    // Check if resultTime field exists
    if (schema.resultTime) {
      console.log('✅ resultTime field exists in schema');
    } else {
      console.log('❌ resultTime field does NOT exist in schema');
    }

    // Check existing games
    console.log('\n2. Checking existing games in database...');
    const games = await Game.find({}).limit(3).select('nickName resultTime');
    console.log(`Found ${games.length} games:`);
    games.forEach((game, index) => {
      console.log(`  Game ${index + 1}:`, {
        id: game._id,
        nickName: game.nickName,
        resultTime: game.resultTime,
        hasResultTime: game.resultTime !== undefined && game.resultTime !== null
      });
    });

    // Test creating a game with resultTime
    console.log('\n3. Testing direct Game model save with resultTime...');
    const testGame = new Game({
      nickName: 'Schema Test Game ' + Date.now(),
      gameType: 'local',
      isActive: true,
      resultTime: '06:15 PM'
    });

    console.log('📤 Test game before save:', {
      nickName: testGame.nickName,
      resultTime: testGame.resultTime,
      _doc: testGame._doc
    });

    const savedGame = await testGame.save();
    console.log('✅ Game saved successfully');
    console.log('📥 Saved game data:', {
      id: savedGame._id,
      nickName: savedGame.nickName,
      resultTime: savedGame.resultTime,
      _doc: savedGame._doc
    });

    // Check if resultTime persisted
    const retrievedGame = await Game.findById(savedGame._id);
    console.log('📥 Retrieved game from database:', {
      id: retrievedGame._id,
      nickName: retrievedGame.nickName,
      resultTime: retrievedGame.resultTime
    });

    // Clean up
    await Game.findByIdAndDelete(savedGame._id);
    console.log('✅ Test game cleaned up');

    console.log('\n🎯 SCHEMA DEBUG SUMMARY:');
    console.log('- Schema has resultTime field: ' + (schema.resultTime ? '✅ Yes' : '❌ No'));
    console.log('- Direct save works: ' + (retrievedGame.resultTime === '06:15 PM' ? '✅ Yes' : '❌ No'));

  } catch (error) {
    console.error('❌ Schema debug failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n📦 MongoDB connection closed');
  }
}

debugDatabaseSchema();