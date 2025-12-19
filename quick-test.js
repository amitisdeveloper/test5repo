const axios = require('axios');

axios.get('http://localhost:3001/api/games')
  .then(r => {
    console.log('✅ Backend is working!');
    console.log('Status:', r.status);
    console.log('Total Games:', (r.data.prime?.length || 0) + (r.data.local?.length || 0));
  })
  .catch(e => {
    console.log('❌ Error:', e.message);
    console.log('Make sure backend is running: cd backend && npm start');
  });
