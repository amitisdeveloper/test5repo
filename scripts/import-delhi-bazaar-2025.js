const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { MongoClient, ObjectId } = require('mongodb');
const { getTodayDateStringIST_YYYYMMDD } = require('../backend/utils/timezone');
require('dotenv').config();

function getOptionValue(name) {
  const prefix = `${name}=`;
  const inlineValue = process.argv.find((arg) => arg.startsWith(prefix));

  if (inlineValue) {
    return inlineValue.slice(prefix.length);
  }

  const optionIndex = process.argv.indexOf(name);
  return optionIndex >= 0 ? process.argv[optionIndex + 1] : '';
}

const positionalArgs = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const WORKBOOK_PATH = positionalArgs[0] || 'd:\\reactapps\\tempproj\\figma\\555 games app\\resultdata\\delhi_bazar_2025_raw_year_matrix_v2.xlsx';
const YEAR = Number(getOptionValue('--year') || 2025);
const GAME_NICK_NAME = getOptionValue('--game') || 'Delhi Bazaar';
const DRY_RUN = process.argv.includes('--dry-run');
const MAX_SOURCE_DATE = getTodayDateStringIST_YYYYMMDD();
const PLACEHOLDER_RESULTS = new Set(['--', '##', 'wait']);

const MONTHS = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER'
];

function decodeXml(value) {
  return String(value || '')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function getAttribute(xml, name) {
  const match = xml.match(new RegExp(`\\s${name}="([^"]*)"`));
  return match ? decodeXml(match[1]) : '';
}

function columnToNumber(column) {
  return column.split('').reduce((total, char) => total * 26 + char.charCodeAt(0) - 64, 0);
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function extractWorkbook(workbookPath) {
  if (!fs.existsSync(workbookPath)) {
    throw new Error(`Workbook not found: ${workbookPath}`);
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'year-matrix-xlsx-'));
  const tempZipPath = path.join(tempDir, 'workbook.zip');

  try {
    fs.copyFileSync(workbookPath, tempZipPath);
    execFileSync('powershell.exe', [
      '-NoProfile',
      '-Command',
      `Expand-Archive -LiteralPath ${JSON.stringify(tempZipPath)} -DestinationPath ${JSON.stringify(tempDir)} -Force`
    ], { stdio: 'pipe' });

    return {
      tempDir,
      sharedStringsPath: path.join(tempDir, 'xl', 'sharedStrings.xml'),
      sheetPath: path.join(tempDir, 'xl', 'worksheets', 'sheet1.xml')
    };
  } catch (error) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    throw error;
  }
}

function readSharedStrings(sharedStringsPath) {
  if (!fs.existsSync(sharedStringsPath)) {
    return [];
  }

  const xml = fs.readFileSync(sharedStringsPath, 'utf8');
  const strings = [];
  const siMatches = xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g);

  for (const siMatch of siMatches) {
    const textParts = [];
    const tMatches = siMatch[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g);

    for (const tMatch of tMatches) {
      textParts.push(decodeXml(tMatch[1]));
    }

    strings.push(textParts.join(''));
  }

  return strings;
}

function readSheetRows(sheetPath, sharedStrings) {
  const xml = fs.readFileSync(sheetPath, 'utf8');
  const rows = [];
  const rowMatches = xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g);

  for (const rowMatch of rowMatches) {
    const row = {};
    const cellMatches = rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g);

    for (const cellMatch of cellMatches) {
      const attributes = cellMatch[1];
      const body = cellMatch[2];
      const reference = getAttribute(attributes, 'r');
      const type = getAttribute(attributes, 't');
      const column = reference.replace(/\d+/g, '');
      const valueMatch = body.match(/<v\b[^>]*>([\s\S]*?)<\/v>/);

      if (!reference) {
        continue;
      }

      if (type === 'inlineStr') {
        const inlineTextParts = [];
        const inlineTextMatches = body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g);

        for (const inlineTextMatch of inlineTextMatches) {
          inlineTextParts.push(decodeXml(inlineTextMatch[1]));
        }

        row[columnToNumber(column)] = inlineTextParts.join('');
        continue;
      }

      if (!valueMatch) {
        continue;
      }

      const rawValue = decodeXml(valueMatch[1]);
      row[columnToNumber(column)] = type === 's' ? sharedStrings[Number(rawValue)] : rawValue;
    }

    rows.push(row);
  }

  return rows;
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function readCsvRows(csvPath) {
  const content = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
  return content
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
      const row = {};
      parseCsvLine(line).forEach((value, index) => {
        row[index + 1] = value.trim();
      });
      return row;
    });
}

function parseResultRows(workbookPath) {
  const extension = path.extname(workbookPath).toLowerCase();

  if (extension === '.csv') {
    return parseSheetRows(readCsvRows(workbookPath));
  }

  const extracted = extractWorkbook(workbookPath);

  try {
    const sharedStrings = readSharedStrings(extracted.sharedStringsPath);
    return parseSheetRows(readSheetRows(extracted.sheetPath, sharedStrings));
  } finally {
    fs.rmSync(extracted.tempDir, { recursive: true, force: true });
  }
}

function parseSheetRows(sheetRows) {
  const header = sheetRows[0] || {};
  const months = MONTHS.map((_, index) => String(header[index + 2] || '').trim().toUpperCase());

  if (months.join('|') !== MONTHS.join('|')) {
    throw new Error(`Unexpected month header: ${months.join(', ')}`);
  }

  const rows = [];
  const invalidCalendarCells = [];
  const invalidValues = [];
  let skippedPlaceholderCells = 0;
  let skippedFutureCells = 0;

  for (const sheetRow of sheetRows.slice(1)) {
    const day = Number(String(sheetRow[1] || '').trim());

    if (!Number.isInteger(day) || day < 1 || day > 31) {
      continue;
    }

    for (let month = 1; month <= 12; month += 1) {
      const rawValue = String(sheetRow[month + 1] || '').trim();

      if (!rawValue) {
        continue;
      }

      if (day > daysInMonth(YEAR, month)) {
        invalidCalendarCells.push({ month, day, value: rawValue });
        continue;
      }

      const date = `${YEAR}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      if (PLACEHOLDER_RESULTS.has(rawValue.toLowerCase())) {
        skippedPlaceholderCells += 1;
        continue;
      }

      if (date > MAX_SOURCE_DATE) {
        skippedFutureCells += 1;
        continue;
      }

      if (!/^\d{1,3}$/.test(rawValue)) {
        invalidValues.push({ date, value: rawValue });
        continue;
      }

      rows.push({
        date,
        publishedNumber: rawValue
      });
    }
  }

  return {
    rows,
    invalidCalendarCells,
    invalidValues,
    skippedPlaceholderCells,
    skippedFutureCells
  };
}

function getPublishDate(dateString) {
  return new Date(`${dateString}T08:30:00.000Z`);
}

function addDaysToDateString(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getStorageDateString(dateString, gameNickName) {
  return gameNickName === 'Disawar' ? addDaysToDateString(dateString, 1) : dateString;
}

async function main() {
  const {
    rows,
    invalidCalendarCells,
    invalidValues,
    skippedPlaceholderCells,
    skippedFutureCells
  } = parseResultRows(WORKBOOK_PATH);

  if (invalidValues.length > 0) {
    throw new Error(`Invalid result values found: ${JSON.stringify(invalidValues.slice(0, 10))}`);
  }

  const client = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000
  });

  await client.connect();

  try {
    const db = client.db();
    const games = db.collection('games');
    const users = db.collection('users');
    const publishedResults = db.collection('gamepublishedresults');

    const game = await games.findOne({ nickName: GAME_NICK_NAME, isActive: true }, { projection: { _id: 1, nickName: 1, resultTime: 1 } });

    if (!game) {
      throw new Error(`Active game not found: ${GAME_NICK_NAME}`);
    }

    const adminUser = await users.findOne({ role: 'admin', isActive: { $ne: false } }, { projection: { _id: 1, username: 1 } });

    if (!adminUser) {
      throw new Error('Active admin user not found for createdBy/updatedBy fields');
    }

    const firstStorageDate = getStorageDateString(`${YEAR}-01-01`, game.nickName);
    const lastStorageDate = getStorageDateString(`${YEAR}-12-31`, game.nickName);
    const existing = await publishedResults
      .find({
        gameId: game._id,
        publishDate: {
          $gte: getPublishDate(firstStorageDate),
          $lte: getPublishDate(lastStorageDate)
        }
      }, { projection: { publishDate: 1, publishedNumber: 1 } })
      .toArray();

    const existingByStorageDate = new Map(existing.map((result) => [result.publishDate.toISOString().slice(0, 10), result]));
    const operations = [];
    let inserts = 0;
    let updates = 0;
    let unchanged = 0;

    for (const row of rows) {
      const storageDate = getStorageDateString(row.date, game.nickName);
      const publishDate = getPublishDate(storageDate);
      const current = existingByStorageDate.get(storageDate);

      if (!current) {
        inserts += 1;
      } else if (current.publishedNumber === row.publishedNumber) {
        unchanged += 1;
        continue;
      } else {
        updates += 1;
      }

      const auditEntry = {
        action: current ? 'updated' : 'created',
        previousValue: current ? current.publishedNumber : null,
        newValue: row.publishedNumber,
        changedBy: new ObjectId(adminUser._id),
        changedAt: new Date()
      };

      operations.push({
        updateOne: {
          filter: { gameId: game._id, publishDate },
          update: {
            $set: {
              publishedNumber: row.publishedNumber,
              updatedBy: adminUser._id,
              updatedAt: new Date()
            },
            $setOnInsert: {
              gameId: game._id,
              publishDate,
              createdBy: adminUser._id,
              createdAt: new Date()
            },
            $push: {
              auditTrail: auditEntry
            }
          },
          upsert: true
        }
      });
    }

    console.log(JSON.stringify({
      dryRun: DRY_RUN,
      game: { _id: game._id.toString(), nickName: game.nickName, resultTime: game.resultTime },
      adminUser: { _id: adminUser._id.toString(), username: adminUser.username },
      workbookPath: WORKBOOK_PATH,
      maxSourceDate: MAX_SOURCE_DATE,
      parsedRows: rows.length,
      skippedPlaceholderCells,
      skippedFutureCells,
      storedDateRule: game.nickName === 'Disawar' ? 'source date + 1 day' : 'source date',
      invalidCalendarCellsIgnored: invalidCalendarCells.length,
      existingRowsInYear: existing.length,
      planned: { inserts, updates, unchanged },
      firstRows: rows.slice(0, 5),
      lastRows: rows.slice(-5)
    }, null, 2));

    if (!DRY_RUN && operations.length > 0) {
      const result = await publishedResults.bulkWrite(operations, { ordered: true });
      console.log(JSON.stringify({
        inserted: result.upsertedCount,
        modified: result.modifiedCount,
        matched: result.matchedCount
      }, null, 2));
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
