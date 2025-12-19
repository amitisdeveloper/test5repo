const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const readline = require('readline');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/555results', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Check if admin exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists:');
      console.log(`Username: ${existingAdmin.username}`);
      console.log(`Email: ${existingAdmin.email}`);
      rl.close();
      process.exit(0);
    }

    // Prompt for admin details
    rl.question('Admin Username (default: admin): ', (username) => {
      const adminUsername = username || 'admin';
      
      rl.question('Admin Email: ', (email) => {
        if (!email) {
          console.error('Email is required');
          rl.close();
          process.exit(1);
        }

        rl.question('Admin Password: ', async (password) => {
          if (!password || password.length < 6) {
            console.error('Password must be at least 6 characters');
            rl.close();
            process.exit(1);
          }

          try {
            const adminUser = new User({
              username: adminUsername,
              email: email.toLowerCase(),
              password: password,
              role: 'admin'
            });

            await adminUser.save();
            console.log('\n✓ Admin user created successfully!');
            console.log(`Username: ${adminUsername}`);
            console.log(`Email: ${email}`);
            
            rl.close();
            process.exit(0);
          } catch (error) {
            console.error('Error creating admin:', error.message);
            rl.close();
            process.exit(1);
          }
        });
      });
    });
  } catch (error) {
    console.error('Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

createAdmin();
