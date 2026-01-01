/**
 * Complete end-to-end test for Result Time feature
 * This tests the entire flow: API endpoints + database operations
 */

require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Game Model for direct database testing
const gameSchema = new mongoose.Schema({
  name: { type: String, trim: true, maxlength: 100 },
  nickName: { type: String, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500 },
  status: { type: String, enum: ['active', 'inactive', 'completed', 'suspended'], default: 'active' },
  gameType: { type: String, enum: ['lottery', 'draw', 'raffle', 'other', 'prime', 'local'], default: 'lottery' },
  drawTime: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  resultTime: { type: String, trim: true, maxlength: 8 },
  settings: {
    minNumber: { type: Number, default: 1 },
    maxNumber: { type: Number, default: 100 },
    drawCount: { type: Number, default: 1 },
    prizeStructure: { type: mongoose.Schema.Types.Mixed }
  }
}, { timestamps: true });

const Game = mongoose.model('Game', gameSchema);

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function testCompleteResultTimeFlow() {
  try {
    console.log('🚀 Testing Complete Result Time Feature End-to-End...\n');

    // Step 1: Connect to MongoDB and get admin token
    console.log('1. Setting up database connection...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/555results';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected');

    // Get admin token by logging in
    console.log('\n2. Getting admin authentication token...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Admin token obtained');

    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Step 3: Test Create Game API with resultTime
    console.log('\n3. Testing Create Game API with resultTime...');
    const testGame = {
      nickName: 'API Test Game ' + Date.now(),
      gameType: 'local',
      isActive: true,
      resultTime: '04:30 PM'
    };

    console.log('📤 Creating game with data:', testGame);

    const createResponse = await axios.post(
      `${API_BASE_URL}/api/games`,
      testGame,
      { headers: authHeaders }
    );

    const createdGame = createResponse.data;
    console.log('✅ Game created successfully');
    console.log('📥 Created game data:', {
      id: createdGame._id,
      nickName: createdGame.nickName,
      resultTime: createdGame.resultTime
    });

    // Verify resultTime was saved
    if (createdGame.resultTime === '04:30 PM') {
      console.log('✅ resultTime saved correctly in API response');
    } else {
      console.log('❌ resultTime NOT saved correctly. Expected: "04:30 PM", Got:', createdGame.resultTime);
    }

    // Step 4: Test Update Game API with new resultTime
    console.log('\n4. Testing Update Game API with new resultTime...');
    const updateData = {
      resultTime: '08:45 PM'
    };

    console.log('📤 Updating game with data:', updateData);

    const updateResponse = await axios.put(
      `${API_BASE_URL}/api/games/${createdGame._id}`,
      updateData,
      { headers: authHeaders }
    );

    const updatedGame = updateResponse.data;
    console.log('✅ Game updated successfully');
    console.log('📥 Updated game data:', {
      id: updatedGame._id,
      nickName: updatedGame.nickName,
      resultTime: updatedGame.resultTime
    });

    // Verify resultTime was updated
    if (updatedGame.resultTime === '08:45 PM') {
      console.log('✅ resultTime updated correctly in API response');
    } else {
      console.log('❌ resultTime NOT updated correctly. Expected: "08:45 PM", Got:', updatedGame.resultTime);
    }

    // Step 5: Test Get Games API to ensure resultTime is returned
    console.log('\n5. Testing Get Games API to verify resultTime is returned...');
    const getResponse = await axios.get(`${API_BASE_URL}/api/games`);
    const games = getResponse.data;

    // Find our test game in the response
    const testGameInResponse = [...games.prime, ...games.local].find(g => g._id === createdGame._id);
    
    if (testGameInResponse) {
      console.log('✅ Test game found in API response');
      console.log('📥 Game data from API:', {
        id: testGameInResponse._id,
        nickName: testGameInResponse.nickName,
        resultTime: testGameInResponse.resultTime
      });

      if (testGameInResponse.resultTime === '08:45 PM') {
        console.log('✅ resultTime correctly returned in Get Games API');
      } else {
        console.log('❌ resultTime NOT correctly returned. Expected: "08:45 PM", Got:', testGameInResponse.resultTime);
      }
    } else {
      console.log('❌ Test game NOT found in API response');
    }

    // Step 6: Test Admin Get Games API
    console.log('\n6. Testing Admin Get Games API...');
    const adminGetResponse = await axios.get(`${API_BASE_URL}/api/games/admin`, { headers: authHeaders });
    const adminGames = adminGetResponse.data.games;

    const testGameInAdminResponse = adminGames.find(g => g._id === createdGame._id);
    
    if (testGameInAdminResponse) {
      console.log('✅ Test game found in Admin API response');
      console.log('📥 Admin game data:', {
        id: testGameInAdminResponse._id,
        nickName: testGameInAdminResponse.nickName,
        resultTime: testGameInAdminResponse.resultTime
      });

      if (testGameInAdminResponse.resultTime === '08:45 PM') {
        console.log('✅ resultTime correctly returned in Admin Get Games API');
      } else {
        console.log('❌ resultTime NOT correctly returned in Admin API. Expected: "08:45 PM", Got:', testGameInAdminResponse.resultTime);
      }
    } else {
      console.log('❌ Test game NOT found in Admin API response');
    }

    // Step 7: Direct database verification
    console.log('\n7. Direct database verification...');
    const dbGame = await Game.findById(createdGame._id).select('nickName resultTime');
    
    if (dbGame) {
      console.log('✅ Game found in database');
      console.log('📥 Database game data:', {
        id: dbGame._id,
        nickName: dbGame.nickName,
        resultTime: dbGame.resultTime
      });

      if (dbGame.resultTime === '08:45 PM') {
        console.log('✅ resultTime correctly stored in database');
      } else {
        console.log('❌ resultTime NOT correctly stored in database. Expected: "08:45 PM", Got:', dbGame.resultTime);
      }
    } else {
      console.log('❌ Game NOT found in database');
    }

    // Step 8: Clean up test game
    console.log('\n8. Cleaning up test game...');
    await axios.delete(`${API_BASE_URL}/api/games/${createdGame._id}`, { headers: authHeaders });
    console.log('✅ Test game deleted');

    // Final Summary
    console.log('\n🎯 FINAL TEST SUMMARY:');
    console.log('✅ MongoDB connection: Working');
    console.log('✅ Admin authentication: Working');
    console.log('✅ Create Game API: ' + (createdGame.resultTime === '04:30 PM' ? 'Saves resultTime correctly' : 'FAILS to save resultTime'));
    console.log('✅ Update Game API: ' + (updatedGame.resultTime === '08:45 PM' ? 'Updates resultTime correctly' : 'FAILS to update resultTime'));
    console.log('✅ Get Games API: ' + (testGameInResponse?.resultTime === '08:45 PM' ? 'Returns resultTime correctly' : 'FAILS to return resultTime'));
    console.log('✅ Admin Get Games API: ' + (testGameInAdminResponse?.resultTime === '08:45 PM' ? 'Returns resultTime correctly' : 'FAILS to return resultTime'));
    console.log('✅ Database storage: ' + (dbGame?.resultTime === '08:45 PM' ? 'Stores resultTime correctly' : 'FAILS to store resultTime'));

    const allTestsPassed = 
      createdGame.resultTime === '04:30 PM' &&
      updatedGame.resultTime === '08:45 PM' &&
      testGameInResponse?.resultTime === '08:45 PM' &&
      testGameInAdminResponse?.resultTime === '08:45 PM' &&
      dbGame?.resultTime === '08:45 PM';

    console.log('\n🏆 OVERALL RESULT: ' + (allTestsPassed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌'));

    if (allTestsPassed) {
      console.log('\n🎉 RESULT TIME FEATURE IS FULLY FUNCTIONAL!');
      console.log('The feature has been successfully implemented and tested.');
    } else {
      console.log('\n⚠️  RESULT TIME FEATURE HAS ISSUES!');
      console.log('Please review the failed tests above.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('API Error Response:', error.response.data);
      console.error('API Error Status:', error.response.status);
    }
    if (error.code === 'ECONNREFUSED') {
      console.error('Cannot connect to API server. Make sure the backend is running on port 3001');
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n📦 MongoDB connection closed');
  }
}

// Run the test
testCompleteResultTimeFlow();