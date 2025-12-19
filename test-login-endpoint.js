const axios = require('axios');

async function testLogin() {
  console.log('🔐 Testing Login Endpoint...\n');

  try {
    // Test 1: Direct backend call
    console.log('1. Testing direct backend call...');
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });

    console.log('✅ Direct login successful!');
    console.log('   Status:', response.status);
    console.log('   User:', response.data.user.username);
    console.log('   Token:', response.data.token.substring(0, 20) + '...');
    console.log();

    // Test 2: Login with invalid credentials
    console.log('2. Testing invalid credentials...');
    try {
      await axios.post('http://localhost:3001/api/auth/login', {
        username: 'admin',
        password: 'wrongpassword'
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected invalid password');
        console.log('   Error:', error.response.data.error);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log();

    // Test 3: Missing credentials
    console.log('3. Testing missing credentials...');
    try {
      await axios.post('http://localhost:3001/api/auth/login', {
        username: 'admin'
      });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected missing password');
        console.log('   Error:', error.response.data.error);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testLogin();
