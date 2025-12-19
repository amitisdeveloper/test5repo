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

function getGameDate() {
  const now = getNowIST();
  const hour = now.hour();

  if (hour < GAME_DAY_RESET) {
    return now.subtract(1, 'day').startOf('day').toDate();
  }

  return now.startOf('day').toDate();
}

function getGameDateIST() {
  const now = getNowIST();
  const hour = now.hour();

  if (hour < GAME_DAY_RESET) {
    return now.subtract(1, 'day');
  }

  return now;
}

function getGameDateForTime(date) {
  const dateIST = dayjs(date).tz(IST_TIMEZONE);
  const hour = dateIST.hour();

  if (hour < GAME_DAY_RESET) {
    return dateIST.subtract(1, 'day').startOf('day').toDate();
  }

  return dateIST.startOf('day').toDate();
}

function getGameDayStart(gameDate) {
  const date = dayjs(gameDate).tz(IST_TIMEZONE);
  return date.hour(GAME_DAY_START).minute(0).second(0).millisecond(0).toDate();
}

function getGameDayEnd(gameDate) {
  const date = dayjs(gameDate).tz(IST_TIMEZONE);
  return date.add(1, 'day').hour(GAME_DAY_RESET - 1).minute(59).second(59).millisecond(999).toDate();
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

function getTodayDateIST() {
  return getNowIST().startOf('day').toDate();
}

function getTodayDateStringIST() {
  return getNowIST().format('DD-MMM-YYYY');
}

module.exports = {
  getNowIST,
  getGameDate,
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
  IST_TIMEZONE,
  GAME_DAY_START,
  GAME_DAY_RESET
};
