const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testBackend() {
  console.log('🧪 Testing 555 Results Backend...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health check:', healthResponse.data);
    console.log('   Database status:', healthResponse.data.database);
    console.log('   Environment:', healthResponse.data.environment);
    console.log();

    // Test 2: Create Admin User
    console.log('2. Creating admin user...');
    try {
      const createAdminResponse = await axios.post(`${API_BASE}/auth/create-admin`, {
        username: 'admin',
        password: 'admin123',
        email: 'admin@example.com'
      });
      console.log('✅ Admin user created:', createAdminResponse.data.message);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('ℹ️  Admin user already exists');
      } else {
        console.log('❌ Failed to create admin:', error.response?.data || error.message);
      }
    }
    console.log();

    // Test 3: Login with admin credentials
    console.log('3. Testing login...');
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        username: 'admin',
        password: 'admin123'
      });
      console.log('✅ Login successful!');
      console.log('   User:', loginResponse.data.user.username);
      console.log('   Role:', loginResponse.data.user.role);
      console.log('   Token received:', !!loginResponse.data.token);
      
      const token = loginResponse.data.token;

      // Test 4: Protected endpoint
      console.log('\n4. Testing protected endpoint...');
      const gamesResponse = await axios.get(`${API_BASE}/games/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Protected endpoint accessible');
      console.log('   Games found:', gamesResponse.data.games.length);
      
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data || error.message);
    }
    console.log();

    // Test 5: Public endpoints
    console.log('5. Testing public endpoints...');
    try {
      const gamesResponse = await axios.get(`${API_BASE}/games`);
      console.log('✅ Public games endpoint working');
      console.log('   Prime games:', gamesResponse.data.prime?.length || 0);
      console.log('   Local games:', gamesResponse.data.local?.length || 0);
    } catch (error) {
      console.log('❌ Public endpoint failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.log('❌ Backend test failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Make sure MongoDB is running');
    console.log('2. Run: cd backend && npm install');
    console.log('3. Run: npm start');
    console.log('4. Check if port 3001 is available');
  }
}

testBackend();