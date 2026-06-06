const { MongoClient } = require('mongodb');
const { getGameDayStart, getCurrentGameDayIST } = require('../backend/utils/timezone');
require('dotenv').config();

const APPLY_CHANGES = process.argv.includes('--apply');
const PLACEHOLDER_PATTERN = /^\s*(?:--|##|wait)\s*$/i;

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  const client = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000
  });

  await client.connect();

  try {
    const db = client.db();
    const publishedResults = db.collection('gamepublishedresults');
    const games = db.collection('games');
    const todayStart = getGameDayStart(getCurrentGameDayIST());

    const placeholders = await publishedResults
      .find(
        { publishedNumber: PLACEHOLDER_PATTERN },
        { projection: { gameId: 1, publishDate: 1, publishedNumber: 1 } }
      )
      .sort({ publishDate: 1 })
      .toArray();
    const futureResults = await publishedResults
      .find(
        { publishDate: { $gt: todayStart } },
        { projection: { gameId: 1, publishDate: 1, publishedNumber: 1 } }
      )
      .sort({ publishDate: 1 })
      .toArray();

    const relevantResults = [...placeholders, ...futureResults];
    const placeholderGameIds = [...new Set(placeholders.map((result) => result.gameId.toString()))];
    const gameDocuments = await games
      .find(
        { _id: { $in: relevantResults.map((result) => result.gameId) } },
        { projection: { nickName: 1, name: 1 } }
      )
      .toArray();
    const gameNames = new Map(
      gameDocuments.map((game) => [game._id.toString(), game.nickName || game.name || 'Unknown Game'])
    );

    const countsByGame = {};
    let futurePlaceholders = 0;

    for (const result of placeholders) {
      const gameName = gameNames.get(result.gameId.toString()) || result.gameId.toString();
      countsByGame[gameName] = (countsByGame[gameName] || 0) + 1;

      if (result.publishDate > todayStart) {
        futurePlaceholders += 1;
      }
    }

    console.log(JSON.stringify({
      mode: APPLY_CHANGES ? 'apply' : 'dry-run',
      currentGameDateStart: todayStart.toISOString(),
      placeholderDocuments: placeholders.length,
      futurePlaceholderDocuments: futurePlaceholders,
      futureDocuments: futureResults.length,
      affectedGames: placeholderGameIds.length,
      countsByGame,
      sample: placeholders.slice(0, 10).map((result) => ({
        id: result._id.toString(),
        game: gameNames.get(result.gameId.toString()) || result.gameId.toString(),
        publishDate: result.publishDate.toISOString(),
        publishedNumber: result.publishedNumber
      })),
      futureSample: futureResults.slice(0, 10).map((result) => ({
        id: result._id.toString(),
        game: gameNames.get(result.gameId.toString()) || result.gameId.toString(),
        publishDate: result.publishDate.toISOString(),
        publishedNumber: result.publishedNumber
      }))
    }, null, 2));

    if (!APPLY_CHANGES || placeholders.length === 0) {
      return;
    }

    const deletion = await publishedResults.deleteMany({
      _id: { $in: placeholders.map((result) => result._id) }
    });

    console.log(JSON.stringify({ deletedDocuments: deletion.deletedCount }, null, 2));
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
