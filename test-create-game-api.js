/**
 * Simple test to create a game with resultTime via API
 */

const axios = require('axios');

async function testCreateGameWithResultTime() {
  try {
    console.log('🧪 Testing Create Game API with resultTime...\n');

    // Step 1: Get admin token
    console.log('1. Getting admin token...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Admin token obtained');

    // Step 2: Create game with resultTime
    console.log('\n2. Creating game with resultTime...');
    const gameData = {
      nickName: 'API Test Game ' + Date.now(),
      gameType: 'local',
      isActive: true,
      resultTime: '03:45 PM'
    };

    console.log('📤 Game data:', gameData);

    const createResponse = await axios.post(
      'http://localhost:3001/api/games',
      gameData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const createdGame = createResponse.data;
    console.log('✅ Game created successfully');
    console.log('📥 Response data:', {
      id: createdGame._id,
      nickName: createdGame.nickName,
      gameType: createdGame.gameType,
      resultTime: createdGame.resultTime
    });

    // Check if resultTime was saved
    if (createdGame.resultTime === '03:45 PM') {
      console.log('✅ SUCCESS: resultTime saved correctly!');
    } else {
      console.log('❌ FAILURE: resultTime NOT saved correctly');
      console.log('   Expected: "03:45 PM"');
      console.log('   Got:', createdGame.resultTime);
    }

    // Step 3: Clean up - delete the test game
    console.log('\n3. Cleaning up test game...');
    await axios.delete(`http://localhost:3001/api/games/${createdGame._id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Test game deleted');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('API Error Response:', error.response.data);
      console.error('API Error Status:', error.response.status);
    }
  }
}

testCreateGameWithResultTime();