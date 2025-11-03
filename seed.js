const mongoose = require('mongoose');
const Game = require('./models/Game');
const Result = require('./models/Result');
const User = require('./models/User');
require('dotenv').config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/555results');
    console.log('Connected to MongoDB for seeding');

    // Clear existing data
    await Game.deleteMany({});
    await Result.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      password: 'admin123',
      role: 'admin'
    });
    await adminUser.save();
    console.log('Admin user created: username: admin, password: admin123');

    // Seed Games and Results from October 1st to 18th, 2025
    const year = 2025;
    const month = 9; // October (0-based index)
    const startDay = 1;
    const endDay = 18;

    const gamesData = [];
    const resultsData = [];

    // Game templates with relative hours from start of day
    const gameTemplates = [
      { nickName: 'Delhi Bazar', startHour: 13, duration: 1, gameType: 'prime' }, // 1 PM - 2 PM
      { nickName: 'Shri Ganesh', startHour: 14, duration: 1, gameType: 'prime' }, // 2 PM - 3 PM
      { nickName: 'Faridabad', startHour: 15, duration: 1, gameType: 'prime' }, // 3 PM - 4 PM
      { nickName: 'Ghaziabad', startHour: 16, duration: 1, gameType: 'prime' }, // 4 PM - 5 PM
      { nickName: 'Gali', startHour: 17, duration: 1, gameType: 'prime' }, // 5 PM - 6 PM
      { nickName: 'Disawar', startHour: 18, duration: 1, gameType: 'prime' }, // 6 PM - 7 PM
      { nickName: 'Super Royal', startHour: 19, duration: 1, gameType: 'local' }, // 7 PM - 8 PM
      { nickName: 'Chandigarh', startHour: 20, duration: 1, gameType: 'local' }, // 8 PM - 9 PM
      { nickName: 'Kishangarh', startHour: 21, duration: 1, gameType: 'local' }, // 9 PM - 10 PM
    ];

    for (let day = startDay; day <= endDay; day++) {
      const date = new Date(year, month, day);

      gameTemplates.forEach(template => {
        const startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), template.startHour, 0, 0);
        const endTime = new Date(startTime.getTime() + template.duration * 60 * 60 * 1000);

        gamesData.push({
          nickName: template.nickName,
          startTime,
          endTime,
          isActive: true,
          gameType: template.gameType
        });

        // Generate result for each game
        const result = Math.floor(Math.random() * 99 + 1).toString().padStart(2, '0'); // 01-99

        resultsData.push({
          name: template.nickName,
          time: startTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          left: result,
          center: result,
          right: result,
          result,
          createdAt: endTime // Set createdAt to endTime for historical data
        });
      });
    }

    await Game.insertMany(gamesData);
    console.log(`Games seeded successfully: ${gamesData.length} games`);

    await Result.insertMany(resultsData);
    console.log(`Results seeded successfully: ${resultsData.length} results`);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;
