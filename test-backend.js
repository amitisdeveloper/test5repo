const axios = require('axios');

const testBackend = async () => {
  const baseURL = 'http://localhost:3001';
  
  try {
    console.log('🔍 Testing backend connectivity...');
    
    // Test health endpoint
    console.log('\n1. Testing health endpoint:');
    const healthResponse = await axios.get(`${baseURL}/api/health`);
    console.log('✅ Health check:', healthResponse.data);
    
    // Test if we can create an admin user (this will also test if MongoDB is working)
    console.log('\n2. Testing admin user creation:');
    try {
      const createAdminResponse = await axios.post(`${baseURL}/api/auth/create-admin`, {
        username: 'admin',
        password: 'admin123',
        email: 'admin@example.com'
      });
      console.log('✅ Admin user created:', createAdminResponse.data);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('ℹ️  Admin user already exists');
      } else {
        throw error;
      }
    }
    
    // Test login
    console.log('\n3. Testing login:');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    console.log('✅ Login successful:', {
      token: loginResponse.data.token ? 'Token received' : 'No token',
      user: loginResponse.data.user
    });
    
    const token = loginResponse.data.token;
    
    // Test games endpoint with auth
    console.log('\n4. Testing games endpoint (with auth):');
    const gamesResponse = await axios.get(`${baseURL}/api/games`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Games endpoint working:', {
      count: gamesResponse.data.games?.length || 0,
      pagination: gamesResponse.data.pagination
    });
    
    console.log('\n🎉 Backend is working perfectly!');
    
  } catch (error) {
    console.error('\n❌ Backend test failed:');
    if (error.code === 'ECONNREFUSED') {
      console.error('Backend server is not running on port 3001');
      console.error('Please run: npm run server');
    } else if (error.response) {
      console.error('HTTP Error:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
};

testBackend();