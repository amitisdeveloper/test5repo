/**
 * Final test to verify Result Time feature is working
 */

const axios = require('axios');

async function finalResultTimeTest() {
  try {
    console.log('🎯 Final Result Time Feature Test\n');

    // Test 1: Create game with resultTime
    console.log('1. Testing game creation with resultTime...');
    
    // First get token
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Create game
    const gameData = {
      nickName: 'Final Test Game ' + Date.now(),
      gameType: 'local',
      isActive: true,
      resultTime: '05:30 PM'
    };

    console.log('📤 Creating game with resultTime:', gameData.resultTime);

    const createResponse = await axios.post(
      'http://localhost:3001/api/games',
      gameData,
      { headers }
    );

    const createdGame = createResponse.data;
    console.log('✅ Game created with ID:', createdGame._id);

    // Check if resultTime was saved
    if (createdGame.resultTime === '05:30 PM') {
      console.log('✅ SUCCESS: resultTime saved correctly!');
      console.log('   Saved value:', createdGame.resultTime);
    } else {
      console.log('❌ FAILURE: resultTime NOT saved');
      console.log('   Expected: "05:30 PM"');
      console.log('   Got:', createdGame.resultTime);
    }

    // Test 2: Update game with new resultTime
    console.log('\n2. Testing game update with new resultTime...');
    
    const updateData = { resultTime: '07:45 PM' };
    console.log('📤 Updating with resultTime:', updateData.resultTime);

    const updateResponse = await axios.put(
      `http://localhost:3001/api/games/${createdGame._id}`,
      updateData,
      { headers }
    );

    const updatedGame = updateResponse.data;
    console.log('✅ Game updated');

    if (updatedGame.resultTime === '07:45 PM') {
      console.log('✅ SUCCESS: resultTime updated correctly!');
      console.log('   Updated value:', updatedGame.resultTime);
    } else {
      console.log('❌ FAILURE: resultTime NOT updated');
      console.log('   Expected: "07:45 PM"');
      console.log('   Got:', updatedGame.resultTime);
    }

    // Test 3: Verify through Get Games API
    console.log('\n3. Testing Get Games API...');
    
    const getResponse = await axios.get('http://localhost:3001/api/games');
    const games = getResponse.data;
    
    // Find our test game
    const allGames = [...games.prime, ...games.local];
    const testGame = allGames.find(g => g._id === createdGame._id);
    
    if (testGame) {
      console.log('✅ Game found in Get Games response');
      if (testGame.resultTime === '07:45 PM') {
        console.log('✅ SUCCESS: resultTime correctly returned by API!');
        console.log('   Retrieved value:', testGame.resultTime);
      } else {
        console.log('❌ FAILURE: resultTime NOT correctly returned');
        console.log('   Expected: "07:45 PM"');
        console.log('   Got:', testGame.resultTime);
      }
    } else {
      console.log('❌ Game NOT found in Get Games response');
    }

    // Cleanup
    console.log('\n4. Cleaning up...');
    await axios.delete(`http://localhost:3001/api/games/${createdGame._id}`, { headers });
    console.log('✅ Test game deleted');

    // Final summary
    console.log('\n🏆 FINAL RESULT:');
    const allTestsPassed = 
      createdGame.resultTime === '05:30 PM' &&
      updatedGame.resultTime === '07:45 PM' &&
      testGame?.resultTime === '07:45 PM';

    if (allTestsPassed) {
      console.log('🎉 ALL TESTS PASSED! Result Time feature is working correctly!');
      console.log('✅ Create Game: Saves resultTime');
      console.log('✅ Update Game: Updates resultTime');
      console.log('✅ Get Games: Returns resultTime');
    } else {
      console.log('⚠️ Some tests failed. Please check the issues above.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('API Error:', error.response.data);
      console.error('Status:', error.response.status);
    }
  }
}

finalResultTimeTest();