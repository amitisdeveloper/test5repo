const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const IST_TIMEZONE = 'Asia/Kolkata';
const GAME_DAY_START = 14;
const GAME_DAY_RESET = 6;

function getNowIST() {
  return dayjs().tz(IST_TIMEZONE);
}

/**
 * Single IST day boundary for all game logic
 * Game day starts at 2:00 PM IST and ends at 6:00 AM IST next day
 * 
 * Business Rules:
 * - 14:00-23:59 IST → same calendar day
 * - 00:00-05:59 IST → previous calendar day
 * - 06:00+ IST → new calendar day
 */
function getGameDate() {
  const now = getNowIST();
  const hour = now.hour();

  if (hour < GAME_DAY_RESET) {
    // 00:00-05:59 → previous calendar day
    return now.subtract(1, 'day').startOf('day').toDate();
  } else {
    // 06:00+ → current calendar day
    return now.startOf('day').toDate();
  }
}

/**
 * Get the current game day in IST for filtering and comparison
 * This ensures consistency across all date calculations
 */
function getCurrentGameDayIST() {
  return getGameDate();
}

/**
 * Get start of current game day (2:00 PM IST)
 */
function startOfDayIST() {
  const gameDate = getGameDate();
  const gameDateIST = dayjs(gameDate).tz(IST_TIMEZONE);
  return gameDateIST.hour(GAME_DAY_START).minute(0).second(0).millisecond(0).toDate();
}

/**
 * Get end of current game day (6:00 AM IST next day)
 */
function endOfDayIST() {
  const gameDate = getGameDate();
  const gameDateIST = dayjs(gameDate).tz(IST_TIMEZONE);
  return gameDateIST.add(1, 'day').hour(GAME_DAY_RESET - 1).minute(59).second(59).millisecond(999).toDate();
}

/**
 * Legacy function - now uses single IST boundary
 */
function getGameDateIST() {
  return dayjs(getGameDate()).tz(IST_TIMEZONE);
}

function getGameDateForTime(date) {
  const dateIST = dayjs(date).tz(IST_TIMEZONE);
  const hour = dateIST.hour();

  if (hour < GAME_DAY_RESET) {
    return dateIST.subtract(1, 'day').startOf('day').toDate();
  }

  return dateIST.startOf('day').toDate();
}

/**
 * Legacy functions - now use single IST boundary
 */
function getGameDayStart(gameDate) {
  return startOfDayIST();
}

function getGameDayEnd(gameDate) {
  return endOfDayIST();
}

function formatGameDate(date) {
  return dayjs(date).tz(IST_TIMEZONE).format('DD-MMM-YYYY');
}

function formatGameTime(date) {
  return dayjs(date).tz(IST_TIMEZONE).format('hh:mm A');
}

function formatGameDateTime(date) {
  return dayjs(date).tz(IST_TIMEZONE).format('DD-MMM-YYYY hh:mm A');
}

function getGameDateString(date) {
  return dayjs(date).tz(IST_TIMEZONE).format('DD MMM');
}

function isTodayResult(publishDate) {
  const gameDate = getGameDateIST();
  const publishIST = dayjs(publishDate).tz(IST_TIMEZONE);
  
  const publishHour = publishIST.hour();
  const publishGameDate = publishHour < GAME_DAY_RESET 
    ? publishIST.subtract(1, 'day')
    : publishIST;

  return gameDate.format('YYYY-MM-DD') === publishGameDate.format('YYYY-MM-DD');
}

function getGameDateRange(startDate, endDate) {
  const dates = [];
  let current = dayjs(startDate).tz(IST_TIMEZONE).startOf('day');
  const end = dayjs(endDate).tz(IST_TIMEZONE).startOf('day');

  while (current.isSameOrBefore(end)) {
    dates.push({
      gameDate: current.toDate(),
      displayDate: current.format('DD-MMM-YYYY')
    });
    current = current.add(1, 'day');
  }

  return dates;
}

/**
 * Use single IST day boundary for all "today" references
 * This ensures consistency between local and AWS environments
 */
function getTodayDateIST() {
  return getCurrentGameDayIST();
}

function getTodayDateStringIST() {
  return dayjs(getCurrentGameDayIST()).tz(IST_TIMEZONE).format('DD-MMM-YYYY');
}

function getTodayDateStringIST_YYYYMMDD() {
  return dayjs(getCurrentGameDayIST()).tz(IST_TIMEZONE).format('YYYY-MM-DD');
}

function getGameDateString_YYYYMMDD(date) {
  return dayjs(date).tz(IST_TIMEZONE).format('YYYY-MM-DD');
}

module.exports = {
  getNowIST,
  getGameDate,
  getCurrentGameDayIST,
  startOfDayIST,
  endOfDayIST,
  getGameDateIST,
  getGameDateForTime,
  getGameDayStart,
  getGameDayEnd,
  formatGameDate,
  formatGameTime,
  formatGameDateTime,
  getGameDateString,
  isTodayResult,
  getGameDateRange,
  getTodayDateIST,
  getTodayDateStringIST,
  getTodayDateStringIST_YYYYMMDD,
  getGameDateString_YYYYMMDD,
  IST_TIMEZONE,
  GAME_DAY_START,
  GAME_DAY_RESET
};
