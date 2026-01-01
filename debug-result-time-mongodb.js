/**
 * Debug script to test result time saving with MongoDB
 * This will help identify why result times aren't being saved
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Game Model
const gameSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxlength: 100
  },
  nickName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed', 'suspended'],
    default: 'active'
  },
  gameType: {
    type: String,
    enum: ['lottery', 'draw', 'raffle', 'other', 'prime', 'local'],
    default: 'lottery'
  },
  drawTime: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  resultTime: {
    type: String,
    trim: true,
    maxlength: 8 // Format: "hh:mm AM/PM"
  },
  settings: {
    minNumber: { type: Number, default: 1 },
    maxNumber: { type: Number, default: 100 },
    drawCount: { type: Number, default: 1 },
    prizeStructure: { type: mongoose.Schema.Types.Mixed }
  }
}, {
  timestamps: true
});

const Game = mongoose.model('Game', gameSchema);

async function debugResultTimeSaving() {
  try {
    console.log('🔍 Debugging Result Time Saving Issue with MongoDB...\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/555results';
    console.log('1. Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connection successful');

    // Step 2: Create test game with resultTime
    console.log('\n2. Testing game creation with resultTime...');
    const testGame = new Game({
      name: 'Debug Test Game ' + Date.now(),
      nickName: 'Debug Test Game ' + Date.now(),
      gameType: 'local',
      isActive: true,
      resultTime: '05:30 PM'
    });

    console.log('📤 Game object to save:', {
      name: testGame.name,
      nickName: testGame.nickName,
      gameType: testGame.gameType,
      isActive: testGame.isActive,
      resultTime: testGame.resultTime
    });

    const savedGame = await testGame.save();

    console.log('✅ Game created successfully');
    console.log('📥 Database returned:', {
      id: savedGame._id,
      name: savedGame.name,
      nickName: savedGame.nickName,
      resultTime: savedGame.resultTime,
      createdAt: savedGame.createdAt
    });

    // Step 3: Check if result_time was saved
    console.log('\n3. Verifying result_time was saved...');
    if (savedGame.resultTime) {
      console.log('✅ resultTime saved correctly:', savedGame.resultTime);
    } else {
      console.log('❌ resultTime NOT saved - this is the issue!');
      console.log('Available fields:', Object.keys(savedGame));
    }

    // Step 4: Test updating the result time
    console.log('\n4. Testing result time update...');
    const updatedGame = await Game.findByIdAndUpdate(
      savedGame._id,
      { resultTime: '07:45 PM' },
      { new: true, select: 'name nickName resultTime' }
    );

    if (updatedGame) {
      console.log('✅ Update successful');
      console.log('Updated resultTime:', updatedGame.resultTime);
    } else {
      console.log('❌ Update failed');
    }

    // Step 5: Test fetching games to see what we get back
    console.log('\n5. Testing game fetch...');
    const fetchedGame = await Game.findById(savedGame._id).select('name nickName resultTime');

    if (fetchedGame) {
      console.log('✅ Fetch successful');
      console.log('Fetched game:', {
        id: fetchedGame._id,
        name: fetchedGame.name,
        nickName: fetchedGame.nickName,
        resultTime: fetchedGame.resultTime
      });
    } else {
      console.log('❌ Fetch failed');
    }

    // Clean up test game
    console.log('\n6. Cleaning up test game...');
    await Game.findByIdAndDelete(savedGame._id);
    console.log('✅ Test game cleaned up');

    console.log('\n🎯 Debug Summary:');
    console.log('- MongoDB connection: ✅ Working');
    console.log('- Model schema: ✅ Has resultTime field');
    console.log('- Create operation: ' + (savedGame.resultTime ? '✅ Saves resultTime' : '❌ Does NOT save resultTime'));
    console.log('- Update operation: ' + (updatedGame?.resultTime ? '✅ Updates resultTime' : '❌ Does NOT update resultTime'));

    if (!savedGame.resultTime) {
      console.log('\n🚨 ISSUE IDENTIFIED:');
      console.log('The resultTime field is not being saved to the database.');
      console.log('This suggests either:');
      console.log('1. The database collection was not created properly');
      console.log('2. There is a permissions issue');
      console.log('3. The API is not sending the data correctly');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n📦 MongoDB connection closed');
  }
}

// Run the debug
debugResultTimeSaving();