// Test script for Games CRUD operations
// Run this after starting the backend server

const API_BASE = 'http://localhost:3001/api';

async function testGamesCRUD() {
  console.log('🎮 Testing Games CRUD Operations...\n');

  try {
    // Step 0: Create admin user if it doesn't exist
    console.log('0. Creating admin user...');
    try {
      const createAdminResponse = await fetch(`${API_BASE}/auth/create-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123',
          email: 'admin@example.com'
        })
      });

      if (createAdminResponse.ok) {
        console.log('✅ Admin user created');
      } else {
        const createAdminData = await createAdminResponse.json();
        if (createAdminData.error.includes('already exists')) {
          console.log('✅ Admin user already exists');
        } else {
          console.log('⚠️  Admin creation skipped:', createAdminData.error);
        }
      }
    } catch (error) {
      console.log('⚠️  Admin creation failed (might already exist):', error.message);
    }

    // Step 1: Test login to get token
    console.log('\n1. Testing authentication...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Authentication successful');

    // Step 2: Test getting all games with pagination
    console.log('\n2. Testing GET /games/admin (with pagination)...');
    const gamesResponse = await fetch(`${API_BASE}/games/admin?page=1&limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!gamesResponse.ok) {
      throw new Error(`Get games failed: ${gamesResponse.status}`);
    }

    const gamesData = await gamesResponse.json();
    console.log(`✅ Retrieved ${gamesData.games?.length || 0} games`);
    console.log(`   Pagination: Page ${gamesData.pagination?.currentPage} of ${gamesData.pagination?.totalPages}`);

    // Step 3: Test search functionality
    console.log('\n3. Testing search functionality...');
    const searchResponse = await fetch(`${API_BASE}/games/admin?search=test&page=1&limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!searchResponse.ok) {
      throw new Error(`Search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log(`✅ Search completed: Found ${searchData.games?.length || 0} games`);

    // Step 4: Test filter functionality
    console.log('\n4. Testing filter functionality...');
    const filterResponse = await fetch(`${API_BASE}/games/admin?gameType=local&page=1&limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!filterResponse.ok) {
      throw new Error(`Filter failed: ${filterResponse.status}`);
    }

    const filterData = await filterResponse.json();
    console.log(`✅ Filter completed: Found ${filterData.games?.length || 0} local games`);

    // Step 5: Test creating a new game
    console.log('\n5. Testing POST /games (Create game)...');
    const createGameData = {
      nickName: `Test Game ${Date.now()}`,
      gameType: 'local',
      isActive: true
    };

    const createResponse = await fetch(`${API_BASE}/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(createGameData)
    });

    if (!createResponse.ok) {
      throw new Error(`Create game failed: ${createResponse.status}`);
    }

    const createdGame = await createResponse.json();
    console.log(`✅ Game created: ${createdGame.nickName} (ID: ${createdGame._id})`);

    // Step 6: Test updating the game
    console.log('\n6. Testing PUT /games/:id (Update game)...');
    const updateData = {
      nickName: createdGame.nickName + ' (Updated)',
      isActive: false
    };

    const updateResponse = await fetch(`${API_BASE}/games/${createdGame._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData)
    });

    if (!updateResponse.ok) {
      throw new Error(`Update game failed: ${updateResponse.status}`);
    }

    const updatedGame = await updateResponse.json();
    console.log(`✅ Game updated: ${updatedGame.nickName}`);

    // Step 7: Test publishing result
    console.log('\n7. Testing POST /results (Publish result)...');
    const resultData = {
      gameId: createdGame._id,
      result: '12345'
    };

    const resultResponse = await fetch(`${API_BASE}/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(resultData)
    });

    if (!resultResponse.ok) {
      throw new Error(`Publish result failed: ${resultResponse.status}`);
    }

    const publishedResult = await resultResponse.json();
    console.log(`✅ Result published: ${publishedResult.result} for game ${createdGame.nickName}`);

    // Step 8: Test deleting the game
    console.log('\n8. Testing DELETE /games/:id (Delete game)...');
    const deleteResponse = await fetch(`${API_BASE}/games/${createdGame._id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!deleteResponse.ok) {
      throw new Error(`Delete game failed: ${deleteResponse.status}`);
    }

    const deleteResult = await deleteResponse.json();
    console.log('✅ Game deleted successfully');

    console.log('\n🎉 All CRUD operations completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Authentication');
    console.log('   ✅ Get games with pagination');
    console.log('   ✅ Search functionality');
    console.log('   ✅ Filter functionality');
    console.log('   ✅ Create game');
    console.log('   ✅ Update game');
    console.log('   ✅ Publish result');
    console.log('   ✅ Delete game');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testGamesCRUD();