import { useEffect, useMemo, useRef, useState } from 'react';
import { getDisawarDisplayDate } from '../utils/timezone';

export interface HomeGame {
  _id: string;
  nickName?: string;
  name?: string;
  resultTime?: string;
  hasResult?: boolean;
  result?: string;
  resultDate?: string;
}

const istTime = () => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  return { hours: Number(parts.find(p => p.type === 'hour')?.value || 0), minutes: Number(parts.find(p => p.type === 'minute')?.value || 0) };
};
const deadNow = () => { const { hours, minutes } = istTime(); const value = hours * 60 + minutes; return value >= 540 && value <= 720; };
const timeValue = (value?: string) => {
  const match = value?.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return Number.MAX_SAFE_INTEGER;
  let hour = Number(match[1]); const minute = Number(match[2]); const meridiem = match[3].toUpperCase();
  if (meridiem === 'AM' && hour === 12) hour = 0; else if (meridiem === 'PM' && hour !== 12) hour += 12;
  const total = hour * 60 + minute;
  return hour < 9 ? total + 1440 : hour >= 12 ? total : Number.MAX_SAFE_INTEGER;
};
const declarationValue = (value?: string) => {
  const match = value?.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i); if (!match) return Number.MAX_SAFE_INTEGER;
  let hour = Number(match[1]); if (match[3].toUpperCase() === 'AM' && hour === 12) hour = 0; else if (match[3].toUpperCase() === 'PM' && hour !== 12) hour += 12;
  return hour * 60 + Number(match[2]);
};
const dateKey = (value: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(value);
const sessionStart = () => { const date = new Date(); if (istTime().hours < 9) date.setDate(date.getDate() - 1); return dateKey(date); };
const latestIsCurrent = (result: any, now: Date) => {
  if (!result) return false; if (istTime().hours < 10) return true;
  const value = result.publishDate || result.date; if (!value) return false;
  const date = new Date(value); return !Number.isNaN(date.getTime()) && dateKey(date) === dateKey(now);
};
export const resultIsCurrent = (game: HomeGame, sessionDate: string) => {
  if (!game.resultDate) return false;
  return dateKey(new Date(getDisawarDisplayDate(game.resultDate, game.nickName || ''))) === sessionDate;
};

export function useHomepageResults() {
  const [games, setGames] = useState<HomeGame[]>([]); const [latest, setLatest] = useState<any>(null);
  const [dateLabel, setDateLabel] = useState('Today'); const [sessionDate, setSessionDate] = useState(sessionStart);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [deadZone, setDeadZone] = useState(deadNow);
  const [clock, setClock] = useState(Date.now()); const first = useRef(true);
  useEffect(() => {
    fetch('/api/visitors/visit', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined);
    let source: EventSource | null = null; let reconnect: ReturnType<typeof setTimeout> | undefined; let active = true;
    const load = async () => {
      if (first.current) setLoading(true);
      try {
        const [gamesResponse, latestResponse] = await Promise.all([fetch('/api/games'), fetch('/api/games/latest-result')]);
        if (!gamesResponse.ok || !latestResponse.ok) throw new Error();
        const data = await gamesResponse.json(); const latestData = await latestResponse.json(); if (!active) return;
        setGames(data.games || []); setLatest(latestData); setDateLabel(data.todayGameDate || data.todayDateIST || 'Today');
        if (data.todayDateIST_YYYYMMDD) setSessionDate(data.todayDateIST_YYYYMMDD); setError('');
      } catch { if (active) setError('Unable to load the latest results. Please try again.'); }
      finally { if (active && first.current) { first.current = false; setLoading(false); } }
    };
    const connect = () => { source = new EventSource('/api/events/subscribe'); source.onmessage = event => { try { const type = JSON.parse(event.data).type; if (['result-posted','game-created','game-updated','game-deleted'].includes(type)) load(); } catch {} }; source.onerror = () => { source?.close(); reconnect = setTimeout(connect, 5000); }; };
    load(); connect(); const timer = setInterval(() => { setClock(Date.now()); setDeadZone(deadNow()); }, 30000);
    return () => { active = false; source?.close(); if (reconnect) clearTimeout(reconnect); clearInterval(timer); };
  }, []);
  const sortedGames = useMemo(() => [...games].sort((a, b) => {
    const aDisawar = (a.nickName || a.name || '').toLowerCase() === 'disawar'; const bDisawar = (b.nickName || b.name || '').toLowerCase() === 'disawar';
    return Number(aDisawar) - Number(bDisawar) || declarationValue(a.resultTime) - declarationValue(b.resultTime) || (a.nickName || a.name || '').localeCompare(b.nickName || b.name || '');
  }), [games]);
  const current = (() => { const { hours, minutes } = istTime(); const total = hours * 60 + minutes; return hours < 9 ? total + 1440 : hours >= 12 ? total : 0; })();
  const nextGame = deadZone ? null : sortedGames.find(game => {
    const resultTime = timeValue(game.resultTime);
    return resultTime !== Number.MAX_SAFE_INTEGER && resultTime >= current && !game.hasResult;
  }) || null;
  return { games: sortedGames, latestResult: latestIsCurrent(latest, new Date(clock)) ? latest : null, dateLabel, sessionDate, loading, error, deadZone, nextGame };
}
