const axios = require('axios');
const jwt = require('jsonwebtoken');

const API_BASE = 'http://localhost:3001/api';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Create test token
const testToken = jwt.sign(
  { userId: '507f1f77bcf86cd799439011', role: 'admin', username: 'testadmin' },
  JWT_SECRET
);

console.log('Test Token:', testToken);
console.log('='.repeat(60));

async function testCRUD() {
  try {
    // Test 1: Get all games (READ with pagination)
    console.log('\n1. Testing GET /api/games/admin (List all games)');
    const listRes = await axios.get(`${API_BASE}/games/admin?page=1&limit=9`, {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    console.log('Status:', listRes.status);
    console.log('Games count:', listRes.data.games?.length);
    console.log('Pagination:', JSON.stringify(listRes.data.pagination, null, 2));
    console.log('First game:', listRes.data.games?.[0]);

    // Test 2: Create a new game
    console.log('\n2. Testing POST /api/games (Create game)');
    const testGameName = 'Test Game ' + Date.now();
    const createRes = await axios.post(`${API_BASE}/games`, {
      nickName: testGameName,
      gameType: 'prime',
      isActive: true
    }, {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    console.log('Status:', createRes.status);
    const createdGameId = createRes.data._id;
    console.log('Created game ID:', createdGameId);
    console.log('Created game:', JSON.stringify(createRes.data, null, 2));

    // Test 3: Get specific game by ID
    console.log('\n3. Testing GET /api/games/:id (Get single game)');
    const getRes = await axios.get(`${API_BASE}/games/${createdGameId}`, {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    console.log('Status:', getRes.status);
    console.log('Game:', JSON.stringify(getRes.data, null, 2));

    // Test 4: Update the game
    console.log('\n4. Testing PUT /api/games/:id (Update game)');
    const updateRes = await axios.put(`${API_BASE}/games/${createdGameId}`, {
      nickName: 'Updated Test Game ' + Date.now(),
      status: 'inactive'
    }, {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    console.log('Status:', updateRes.status);
    console.log('Updated game:', JSON.stringify(updateRes.data, null, 2));

    // Test 5: List games again to verify update
    console.log('\n5. Testing GET /api/games/admin again (Verify update)');
    const listRes2 = await axios.get(`${API_BASE}/games/admin?page=1&limit=9`, {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    console.log('Games count:', listRes2.data.games?.length);
    console.log('Total items:', listRes2.data.pagination?.totalItems);

    // Test 6: Delete the game
    console.log('\n6. Testing DELETE /api/games/:id (Delete game)');
    const deleteRes = await axios.delete(`${API_BASE}/games/${createdGameId}`, {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    console.log('Status:', deleteRes.status);
    console.log('Response:', JSON.stringify(deleteRes.data, null, 2));

    // Test 7: Verify deletion
    console.log('\n7. Verifying deletion by fetching the game');
    try {
      await axios.get(`${API_BASE}/games/${createdGameId}`, {
        headers: { 'Authorization': `Bearer ${testToken}` }
      });
      console.log('ERROR: Game still exists after deletion!');
    } catch (err) {
      if (err.response?.status === 404) {
        console.log('✓ Game successfully deleted (404 Not Found)');
      } else {
        console.log('ERROR:', err.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('All CRUD tests completed!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Test Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    process.exit(1);
  }
}

// Wait a moment for server to start, then run tests
setTimeout(testCRUD, 2000);
