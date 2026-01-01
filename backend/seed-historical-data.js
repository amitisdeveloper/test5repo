const mongoose = require('mongoose');
const Game = require('./models/Game');
const GamePublishedResult = require('./models/GamePublishedResult');

async function seedHistoricalData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/555results');

    // First, delete all existing published results
    console.log('Deleting all existing published results...');
    const deleteResult = await GamePublishedResult.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing results`);

    // Get all active games
    const games = await Game.find({ isActive: true }).select('_id nickName resultTime createdAt');
    console.log(`\nFound ${games.length} active games:`);

    if (games.length === 0) {
      console.log('No games found. Please create some games first.');
      return;
    }

    // List all games
    games.forEach((game, index) => {
      console.log(`${index + 1}. ${game.nickName} - ${game.resultTime} (created: ${game.createdAt.toISOString().split('T')[0]})`);
    });

    let totalSeeded = 0;

    // Generate data for 2024 and 2025
    for (const year of [2024, 2025]) {
      console.log(`\n📅 Seeding data for ${year}...`);

      for (const game of games) {
        console.log(`  🎯 Processing ${game.nickName}...`);

        // Generate results for each day of the year
        const startDate = new Date(year, 0, 1); // January 1st
        const endDate = new Date(year, 11, 31); // December 31st

        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
          // Generate random result (1-100)
          const result = Math.floor(Math.random() * 100) + 1;

          // Calculate publish date based on game logic
          let publishDate;
          if (game.nickName === 'Disawar') {
            // Disawar: result published on date X shows on date X-1
            // So if we want result to show on date X, publish on date X+1
            const displayDate = new Date(date);
            publishDate = new Date(displayDate);
            publishDate.setDate(displayDate.getDate() + 1);
          } else {
            // Normal games: publish and display on same date
            publishDate = new Date(date);
          }

          // Create the published result
          const publishedResult = new GamePublishedResult({
            gameId: game._id,
            publishDate: publishDate,
            publishedNumber: result.toString().padStart(2, '0'),
            resultTime: game.resultTime || '02:00 PM',
            createdBy: '692b8304eebc2d966faecbcc' // admin user ID
          });

          await publishedResult.save();
          totalSeeded++;
        }
      }
    }

    console.log(`\n✅ Successfully seeded ${totalSeeded} historical results!`);

    // Verify the seeding
    const finalCount = await GamePublishedResult.countDocuments({});
    console.log(`Total published results in database: ${finalCount}`);

    // Show sample results
    const sampleResults = await GamePublishedResult.find({})
      .populate('gameId', 'nickName')
      .sort({ publishDate: -1 })
      .limit(10);

    console.log('\n📊 Sample seeded results:');
    sampleResults.forEach(result => {
      const displayDate = result.gameId.nickName === 'Disawar' ?
        new Date(result.publishDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
        result.publishDate.toISOString().split('T')[0];
      console.log(`- ${result.gameId.nickName}: ${result.publishedNumber} (shows on ${displayDate})`);
    });

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the seeding
seedHistoricalData();