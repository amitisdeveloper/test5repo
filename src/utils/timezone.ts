/**
 * Timezone utility functions for Indian Standard Time (IST) - Frontend
 * Day cycle: 2pm (day X) to 6am (day X+1)
 */

const GAME_DAY_START = 14; // 2pm
const GAME_DAY_RESET = 6;  // 6am

/**
 * Get current UTC date considering the custom game day cycle
 */
export function getGameDate(): Date {
  const options = { timeZone: 'Asia/Calcutta' } as const;
  const utcNow = new Date(new Date().toLocaleString('en-US', options));

  const currentHour = utcNow.getHours();

  if (currentHour < GAME_DAY_RESET) {
    const previousDay = new Date(utcNow);
    previousDay.setDate(previousDay.getDate() - 1);
    return previousDay;
  }

  return utcNow;
}

/**
 * Get game date for a specific time
 */
export function getGameDateForTime(date: Date): Date {
  const hour = date.getHours();

  if (hour < GAME_DAY_RESET) {
    const previousDay = new Date(date);
    previousDay.setDate(previousDay.getDate() - 1);
    return previousDay;
  }

  return date;
}

/**
 * Format date for display in UTC
 */
export function formatGameDate(date: Date): string {
  const options = { 
    timeZone: 'Asia/Calcutta' as const, 
    month: 'short' as const, 
    day: '2-digit' as const, 
    year: 'numeric' as const 
  };
  return new Date(date).toLocaleDateString('en-US', options);
}

/**
 * Format time for display in UTC
 */
export function formatGameTime(date: Date): string {
  const options = { 
    timeZone: 'Asia/Calcutta' as const, 
    hour: '2-digit' as const, 
    minute: '2-digit' as const, 
    hour12: true as const 
  };
  return new Date(date).toLocaleTimeString('en-US', options);
}

/**
 * Check if a published result date falls within today's game day
 */
export function isTodayResult(publishDate: Date): boolean {
  const gameDate = getGameDate();
  const resultGameDate = getGameDateForTime(publishDate);

  return gameDate.toDateString() === resultGameDate.toDateString();
}

/**
 * Get formatted date and time together
 */
export function formatGameDateTime(date: Date): string {
  return `${formatGameDate(date)} ${formatGameTime(date)}`;
}

/**
 * Get game date string for display (e.g., "18 Dec" or "Dec 18")
 */
export function getGameDateString(date: Date): string {
  const options = { 
    timeZone: 'Asia/Calcutta' as const, 
    month: 'short' as const, 
    day: 'numeric' as const 
  };
  return new Date(date).toLocaleDateString('en-US', options);
}
