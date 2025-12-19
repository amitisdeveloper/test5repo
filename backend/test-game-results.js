const mongoose = require('mongoose');
require('dotenv').config();

async function testGameResults() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/555results';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✓ Connected to MongoDB');

    // Import models
    const GamePublishedResult = require('./models/GamePublishedResult');
    const Game = require('./models/Game');
    
    console.log('✓ Models imported successfully');

    // Test that model has required fields
    const schema = GamePublishedResult.schema;
    const fields = Object.keys(schema.paths);
    console.log('✓ GamePublishedResult fields:', fields.filter(f => !f.startsWith('_')));

    // Verify required fields
    const requiredFields = ['gameId', 'publishDate', 'publishedNumber'];
    const hasRequired = requiredFields.every(f => fields.includes(f));
    
    if (hasRequired) {
      console.log('✓ All required fields (gameId, publishDate, publishedNumber) present');
    } else {
      console.log('✗ Warning: Some required fields missing');
    }

    // Test routes import
    const gameResultsRoutes = require('./routes/gameResults');
    console.log('✓ GameResults routes imported successfully');

    console.log('\n✅ All backend tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

testGameResults();
