/**
 * Timezone utility functions for Indian Standard Time (IST)
 * Day cycle: 2pm (day X) to 6am (day X+1)
 * 
 * Between 2pm on day X and 5:59am on day X+1 -> counts as day X
 * At 6am on day X+1 onwards -> counts as day X+1
 */

const GAME_DAY_START = 14; // 2pm = 14:00 in 24-hour format
const GAME_DAY_RESET = 6;  // 6am = 06:00 in 24-hour format

/**
 * Get current UTC date considering the custom game day cycle
 * @returns {Date} Date object representing the game day
 */
function getGameDate() {
  // Get current time in Indian Standard Time
  const options = { timeZone: 'Asia/Calcutta' };
  const utcNow = new Date(new Date().toLocaleString('en-US', options));
  
  const currentHour = utcNow.getHours();
  
  // If current time is before 6am, use previous calendar date
  if (currentHour < GAME_DAY_RESET) {
    const previousDay = new Date(utcNow);
    previousDay.setDate(previousDay.getDate() - 1);
    return previousDay;
  }
  
  return utcNow;
}

/**
 * Get game date for a specific time
 * @param {Date} date - The date to check
 * @returns {Date} Game date for that time
 */
function getGameDateForTime(date) {
  const hour = date.getHours();
  
  if (hour < GAME_DAY_RESET) {
    const previousDay = new Date(date);
    previousDay.setDate(previousDay.getDate() - 1);
    return previousDay;
  }
  
  return date;
}

/**
 * Get start of game day (2pm previous calendar day or same calendar day)
 * @param {Date} gameDate - The game date
 * @returns {Date} Start of game day in UTC
 */
function getGameDayStart(gameDate) {
  const start = new Date(gameDate);
  start.setHours(14, 0, 0, 0);
  
  // Already in IST, no offset needed
  return start;
}

/**
 * Get end of game day (6am next calendar day)
 * @param {Date} gameDate - The game date
 * @returns {Date} End of game day in UTC
 */
function getGameDayEnd(gameDate) {
  const nextDay = new Date(gameDate);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(5, 59, 59, 999);
  
  // Already in IST, no offset needed
  return nextDay;
}

/**
 * Format date for display in UTC
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string (DD-MMM-YYYY)
 */
function formatGameDate(date) {
  const options = { timeZone: 'Asia/Calcutta', month: 'short', day: '2-digit', year: 'numeric' };
  return new Date(date).toLocaleDateString('en-US', options);
}

/**
 * Format time for display in UTC
 * @param {Date} date - The date to format
 * @returns {string} Formatted time string (HH:MM AM/PM)
 */
function formatGameTime(date) {
  const options = { timeZone: 'Asia/Calcutta', hour: '2-digit', minute: '2-digit', hour12: true };
  return new Date(date).toLocaleTimeString('en-US', options);
}

/**
 * Check if a published result date falls within today's game day
 * @param {Date} publishDate - The published result date
 * @returns {boolean} True if the result is for today
 */
function isTodayResult(publishDate) {
  const gameDate = getGameDate();
  const resultGameDate = getGameDateForTime(publishDate);
  
  return gameDate.toDateString() === resultGameDate.toDateString();
}

/**
 * Get all game dates for a date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array<{gameDate: Date, displayDate: string}>} Array of game dates
 */
function getGameDateRange(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    dates.push({
      gameDate: new Date(current),
      displayDate: formatGameDate(current)
    });
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

module.exports = {
  getGameDate,
  getGameDateForTime,
  getGameDayStart,
  getGameDayEnd,
  formatGameDate,
  formatGameTime,
  isTodayResult,
  getGameDateRange,
  GAME_DAY_START,
  GAME_DAY_RESET
};
