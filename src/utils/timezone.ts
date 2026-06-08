const IST_TIMEZONE = 'Asia/Kolkata';

export function formatGameDate(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    const options: Intl.DateTimeFormatOptions = {
      timeZone: IST_TIMEZONE,
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    };
    return d.toLocaleDateString('en-US', options);
  } catch {
    return '';
  }
}

export function formatGameTime(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    const options: Intl.DateTimeFormatOptions = {
      timeZone: IST_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    return d.toLocaleTimeString('en-US', options);
  } catch {
    return '';
  }
}

export function formatGameDateTime(date: string | Date): string {
  return `${formatGameDate(date)} ${formatGameTime(date)}`;
}

// Disawar results are stored one day ahead; subtract one day for display only.
export function getDisawarDisplayDate(publishDate: string, nickName: string): string {
  if (nickName?.toLowerCase() === 'disawar') {
    const d = new Date(publishDate);
    d.setDate(d.getDate() - 1);
    return d.toISOString();
  }
  return publishDate;
}

export function getGameDateString(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    const options: Intl.DateTimeFormatOptions = {
      timeZone: IST_TIMEZONE,
      month: 'short',
      day: 'numeric'
    };
    return d.toLocaleDateString('en-US', options);
  } catch {
    return '';
  }
}
