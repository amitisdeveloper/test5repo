const mongoose = require('../backend/node_modules/mongoose');
require('dotenv').config();

const Game = require('../backend/models/Game');

const APPLY_CHANGES = process.argv.includes('--apply');
const RESTORE_ALL = process.argv.includes('--restore-all');
const RESTORE_ID_ARG = process.argv.find((arg) => arg.startsWith('--restore-id='));
const RESTORE_ID = RESTORE_ID_ARG ? RESTORE_ID_ARG.split('=')[1] : null;
const KEEP_COUNT = 10;
const ARCHIVE_REASON = 'inactive-retention-2025-2026';

const getEffectiveInactiveDate = (game) => {
  const value = game.inactiveAt || game.updatedAt;
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const isFromRetentionYears = (date) => {
  if (!date) return false;
  const year = date.getUTCFullYear();
  return year === 2025 || year === 2026;
};

const summarizeGame = (game) => ({
  id: game._id.toString(),
  name: game.nickName || game.name || 'Unnamed Game',
  inactiveAt: getEffectiveInactiveDate(game)?.toISOString() || null,
  timestampSource: game.inactiveAt ? 'inactiveAt' : 'updatedAt'
});

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000
  });

  try {
    if (RESTORE_ALL || RESTORE_ID) {
      const restoreQuery = {
        archivedAt: { $ne: null },
        archiveReason: ARCHIVE_REASON
      };

      if (RESTORE_ID) {
        restoreQuery._id = RESTORE_ID;
      }

      const archivedGames = await Game.find(restoreQuery)
        .select('_id nickName name inactiveAt updatedAt archivedAt')
        .lean();

      console.log(JSON.stringify({
        mode: APPLY_CHANGES ? 'restore' : 'restore-dry-run',
        restoreCount: archivedGames.length,
        games: archivedGames.map(summarizeGame)
      }, null, 2));

      if (APPLY_CHANGES && archivedGames.length > 0) {
        const result = await Game.updateMany(
          { _id: { $in: archivedGames.map((game) => game._id) } },
          { $set: { archivedAt: null, archiveReason: null } }
        );
        console.log(JSON.stringify({ restoredCount: result.modifiedCount }, null, 2));
      }
      return;
    }

    const inactiveGames = await Game.find({
      isActive: false,
      archivedAt: null
    }).select('_id nickName name inactiveAt updatedAt').lean();

    const eligibleGames = inactiveGames
      .filter((game) => isFromRetentionYears(getEffectiveInactiveDate(game)))
      .sort((a, b) => getEffectiveInactiveDate(b) - getEffectiveInactiveDate(a));

    const retainedGames = eligibleGames.slice(0, KEEP_COUNT);
    const retainedIds = new Set(retainedGames.map((game) => game._id.toString()));
    const gamesToArchive = inactiveGames.filter((game) => !retainedIds.has(game._id.toString()));

    console.log(JSON.stringify({
      mode: APPLY_CHANGES ? 'apply' : 'dry-run',
      rule: 'Keep the 10 most recently inactive games across 2025 and 2026; archive all other inactive games',
      totalVisibleInactive: inactiveGames.length,
      eligibleFrom2025And2026: eligibleGames.length,
      retainedCount: retainedGames.length,
      archiveCount: gamesToArchive.length,
      retainedGames: retainedGames.map(summarizeGame),
      gamesToArchive: gamesToArchive.map(summarizeGame)
    }, null, 2));

    if (!APPLY_CHANGES || gamesToArchive.length === 0) {
      return;
    }

    const archiveIds = new Set(gamesToArchive.map((game) => game._id.toString()));
    const archivedAt = new Date();
    const operations = inactiveGames.map((game) => {
      const setFields = {};

      if (!game.inactiveAt) {
        setFields.inactiveAt = getEffectiveInactiveDate(game);
      }

      if (archiveIds.has(game._id.toString())) {
        setFields.archivedAt = archivedAt;
        setFields.archiveReason = ARCHIVE_REASON;
      }

      return {
        updateOne: {
          filter: { _id: game._id },
          update: { $set: setFields }
        }
      };
    }).filter((operation) => Object.keys(operation.updateOne.update.$set).length > 0);

    const result = operations.length > 0
      ? await Game.collection.bulkWrite(operations, { ordered: true })
      : { modifiedCount: 0 };

    console.log(JSON.stringify({
      archivedCount: gamesToArchive.length,
      modifiedDocuments: result.modifiedCount
    }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
