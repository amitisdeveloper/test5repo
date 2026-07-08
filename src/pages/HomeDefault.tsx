import {
  Bell,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Crown,
  History,
  Home,
  MessageCircle,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Trophy
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import GameChart from '../components/GameChart';
import { formatGameDate } from '../utils/timezone';

type Game = {
  _id?: string;
  nickName?: string;
  name?: string;
  gameName?: string;
  result?: string | number;
  resultTime?: string | null;
  time?: string | null;
  hasResult?: boolean;
  resultDate?: string;
  formattedDate?: string;
};

type HistoryRow = {
  id: string;
  date: string;
  market: string;
  result: string;
  status: 'published' | 'pending';
};

const royal = {
  panel: 'border-[#d5b66f]/20 bg-[#111a31]/90',
  soft: 'border-white/10 bg-white/[0.045]',
  gold: 'text-[#e7c875]'
};

function parseResultTimeToMinutes(time?: string | null) {
  if (!time) return Number.MAX_SAFE_INTEGER;
  const match = time.trim().toUpperCase().replace(/\s+/g, ' ').match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2] || '0', 10);
  if (match[3] === 'AM') hours = hours === 12 ? 0 : hours;
  else hours = hours === 12 ? 12 : hours + 12;
  const total = hours * 60 + minutes;
  return total < 6 * 60 ? total + 24 * 60 : total;
}

function getCurrentISTGameTimeSortValue() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(new Date());
  const hours = parseInt(parts.find((part) => part.type === 'hour')?.value || '0', 10);
  const minutes = parseInt(parts.find((part) => part.type === 'minute')?.value || '0', 10);
  const total = hours * 60 + minutes;
  if (hours < 6) return total + 24 * 60;
  if (hours >= 14) return total;
  return 0;
}

function sortGames<T extends { resultTime?: string | null; nickName?: string }>(games: T[]) {
  return [...games].sort((a, b) => {
    const difference = parseResultTimeToMinutes(a.resultTime) - parseResultTimeToMinutes(b.resultTime);
    return difference || (a.nickName || '').localeCompare(b.nickName || '');
  });
}

function gameName(game?: Game | null) {
  return game?.nickName || game?.name || game?.gameName || 'Market';
}

function resultText(game?: Game | null) {
  if (game?.result === undefined || game?.result === null || game.result === '') return '--';
  return String(game.result).padStart(2, '0');
}

function secondsUntil(time?: string | null) {
  const target = parseResultTimeToMinutes(time);
  if (!Number.isFinite(target) || target === Number.MAX_SAFE_INTEGER) return 0;
  const current = getCurrentISTGameTimeSortValue();
  return Math.max(0, (target >= current ? target - current : target + 1440 - current) * 60);
}

function duration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return [hours, minutes, remainder].map((value) => String(value).padStart(2, '0')).join(':');
}

export default function HomeDefault() {
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);
  const [todaysResults, setTodaysResults] = useState<Game[]>([]);
  const [latestResult, setLatestResult] = useState<Game | null>(null);
  const [todayGameDate, setTodayGameDate] = useState('Today');
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clockTick, setClockTick] = useState(() => Date.now());
  const firstLoad = useRef(true);

  const scheduled = useMemo(() => sortGames(allGames), [allGames]);
  const nextGame = scheduled.find((game) => parseResultTimeToMinutes(game.resultTime) >= getCurrentISTGameTimeSortValue()) || scheduled[0] || null;
  const featured = latestResult || todaysResults[0] || allGames.find((game) => game.hasResult) || null;
  const history = useMemo(() => buildHistoryRows(todaysResults.length ? todaysResults : allGames), [todaysResults, allGames]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (firstLoad.current) setLoading(true);
        const [gamesResponse, latestResponse] = await Promise.all([fetch('/api/games'), fetch('/api/games/latest-result')]);
        if (!gamesResponse.ok || !latestResponse.ok) throw new Error('Failed to fetch results');
        const gamesData = await gamesResponse.json();
        setAllGames(sortGames(gamesData.games || []));
        setUpcomingGames(sortGames(gamesData.upcomingGames || []));
        setTodaysResults(sortGames(gamesData.gamesWithResults || []));
        setTodayGameDate(gamesData.todayGameDate || gamesData.todayDateIST || 'Today');
        setLatestResult(await latestResponse.json());
        setError(null);
      } catch (fetchError) {
        console.error(fetchError);
        setError('Live feed से connection नहीं हो पा रहा है। कृपया थोड़ी देर बाद फिर try करें।');
      } finally {
        setLoading(false);
        firstLoad.current = false;
      }
    };

    fetchData();
    let source: EventSource | null = null;
    let reconnect: ReturnType<typeof setTimeout> | null = null;
    const connect = () => {
      source = new EventSource('/api/events/subscribe');
      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (['result-posted', 'game-created', 'game-updated', 'game-deleted'].includes(data.type)) fetchData();
        } catch { /* heartbeat */ }
      };
      source.onerror = () => {
        source?.close();
        reconnect = setTimeout(connect, 5000);
      };
    };
    connect();
    const timer = setInterval(() => setClockTick(Date.now()), 1000);
    return () => {
      source?.close();
      if (reconnect) clearTimeout(reconnect);
      clearInterval(timer);
    };
  }, []);

  const displayUpcoming = upcomingGames.length ? upcomingGames : scheduled;

  return (
    <div className="royal-home min-h-screen bg-[#070b17] text-[#f8f2e5] [font-family:Inter,'Noto_Sans_Devanagari',system-ui,sans-serif]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(93,24,49,0.35),transparent_28%),radial-gradient(circle_at_90%_18%,rgba(35,57,112,0.32),transparent_30%),linear-gradient(180deg,#070b17_0%,#090d19_65%,#05070d_100%)]" />
      <Header clockTick={clockTick} />
      <main className="relative mx-auto max-w-7xl px-4 pb-28 sm:px-6 lg:px-8">
        <Hero featured={featured} games={allGames} loading={loading} />
        {error && <div className="mb-6 rounded-xl border border-red-300/20 bg-red-950/40 p-4 text-sm text-red-100">{error}</div>}
        <LiveResult result={featured} nextGame={nextGame} date={todayGameDate} tick={clockTick} loading={loading} />
        <Upcoming games={displayUpcoming} tick={clockTick} loading={loading} />
        <MarketBoard games={allGames} loading={loading} onChart={setSelectedGame} />
        <HistoryTable rows={history} />
      </main>
      <Footer />
      <MobileNav />
      {selectedGame && <GameChart gameName={selectedGame} onClose={() => setSelectedGame(null)} />}
    </div>
  );
}

function Header({ clockTick }: { clockTick: number }) {
  const time = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  }).format(new Date(clockTick));
  return (
    <motion.header
      className="royal-header relative z-20 border-b border-[#d5b66f]/15 bg-[#070b17]/85 backdrop-blur-xl"
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: 'easeOut' }}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <motion.a href="#top" className="flex items-center gap-3" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <span className="grid h-11 w-11 place-items-center rounded-xl border border-[#d5b66f]/40 bg-[#d5b66f]/10 text-[#e7c875] shadow-[0_0_30px_rgba(213,182,111,.12)]"><Crown className="h-5 w-5" /></span>
          <span><strong className="block font-serif text-xl tracking-wide text-[#f3d886]">555 Royal</strong><small className="block text-[9px] font-bold uppercase tracking-[.28em] text-slate-400">Live Result Desk</small></span>
        </motion.a>
        <motion.div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-300 sm:flex" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <motion.span className="h-2 w-2 rounded-full bg-emerald-400" animate={{ scale: [1, 1.6, 1], opacity: [0.55, 1, 0.55] }} transition={{ duration: 1.6, repeat: Infinity }} />
          <Clock3 className="h-4 w-4 text-[#d5b66f]" /> {time} IST
        </motion.div>
      </div>
    </motion.header>
  );
}

function Hero({ featured, games, loading }: { featured: Game | null; games: Game[]; loading: boolean }) {
  const ticker = [...games, ...games].map((game) => `${gameName(game)}  ${resultText(game)}`).join('  •  ');
  return (
    <motion.section id="top" className="pb-8 pt-10 md:pb-12 md:pt-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      <div className="grid items-end gap-8 lg:grid-cols-[1fr_430px]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d5b66f]/25 bg-[#d5b66f]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[.22em] text-[#e7c875]"><Sparkles className="h-3.5 w-3.5" /> Fast & verified updates</div>
          <h1 className="max-w-3xl font-serif text-5xl font-black leading-[.98] tracking-tight text-[#fffaf0] sm:text-6xl lg:text-7xl">
            आज के सभी <span className="text-[#e7c875]">Market Results</span>, एक ही जगह।
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">नया result आते ही live update देखें। सभी market timings, previous results और charts साफ़ और आसान layout में।</p>
        </motion.div>
        <motion.div className="royal-featured relative overflow-hidden rounded-3xl border border-[#d5b66f]/25 bg-gradient-to-br from-[#18213d] to-[#0c1224] p-6 shadow-2xl shadow-black/30" initial={{ opacity: 0, x: 36, scale: 0.96 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: 0.7, delay: 0.15, type: 'spring' }} whileHover={{ y: -5, scale: 1.01 }}>
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#722442]/30 blur-3xl" />
          <div className="relative flex items-center justify-between text-[10px] font-bold uppercase tracking-[.2em] text-slate-400"><span>Latest Result</span><span className="flex items-center gap-1.5 text-emerald-400"><Radio className="h-3.5 w-3.5" /> Live</span></div>
          <div className="relative mt-6 flex items-end justify-between gap-5">
            <div><div className="font-serif text-2xl font-bold text-[#f3d886]">{gameName(featured)}</div><div className="mt-2 text-sm text-slate-400">{featured?.resultTime || featured?.time || 'Update का इंतज़ार है'}</div></div>
            <motion.div key={resultText(featured)} className="royal-number font-serif text-7xl font-black leading-none text-[#f4d35e] drop-shadow-[0_0_24px_rgba(244,211,94,.25)]" initial={{ opacity: 0, scale: 0.55, rotate: -6 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 180 }}>{loading ? '..' : resultText(featured)}</motion.div>
          </div>
        </motion.div>
      </div>
      <div className="mt-10 overflow-hidden rounded-xl border-y border-[#d5b66f]/20 bg-[#0d1325]/90 py-3">
        <motion.div className="whitespace-nowrap text-xs font-bold uppercase tracking-[.16em] text-[#d8c48f]" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}>{ticker || 'Live market update का इंतज़ार है'}</motion.div>
      </div>
    </motion.section>
  );
}

function LiveResult({ result, nextGame, date, tick, loading }: { result: Game | null; nextGame: Game | null; date: string; tick: number; loading: boolean }) {
  return (
    <motion.section
      id="live"
      className={`royal-live overflow-hidden rounded-[2rem] border ${royal.panel} shadow-[0_28px_80px_rgba(0,0,0,.28)]`}
      initial={{ opacity: 0, y: 48, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.7, type: 'spring', bounce: 0.18 }}
      whileHover={{ boxShadow: '0 34px 100px rgba(0,0,0,.4)' }}
    >
      <div className="grid lg:grid-cols-[1fr_340px]">
        <div className="relative p-6 sm:p-9">
          <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-[#722442]/25 blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.24em] text-emerald-400"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Live Result</div><h2 className="mt-3 font-serif text-4xl font-black sm:text-5xl">{gameName(result)}</h2></div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-right"><span className="block text-[9px] font-bold uppercase tracking-[.18em] text-slate-500">Updated on</span><strong className="mt-1 block text-sm text-[#ead69c]">{result?.formattedDate || (result?.resultDate ? formatGameDate(result.resultDate) : date)}</strong></div>
          </div>
          <div className="relative mt-8 flex flex-wrap items-end gap-6">
            <motion.div key={resultText(result)} className="royal-number font-serif text-[7rem] font-black leading-none text-[#f4d35e] drop-shadow-[0_0_30px_rgba(244,211,94,.22)] sm:text-[9rem]" initial={{ opacity: 0, y: 30, scale: 0.72 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 150, damping: 13 }}>{loading ? '--' : resultText(result)}</motion.div>
            <div className="mb-2 grid grid-cols-2 gap-3">
              <Metric icon={<Clock3 />} label="Result time" value={result?.resultTime || result?.time || 'Live'} />
              <Metric icon={<ShieldCheck />} label="Status" value="Verified" />
            </div>
          </div>
        </div>
        <div className="border-t border-[#d5b66f]/15 bg-[#090e1d]/80 p-6 lg:border-l lg:border-t-0">
          <div className="text-[10px] font-black uppercase tracking-[.22em] text-slate-500">Next Result</div>
          <div className="mt-3 font-serif text-3xl font-bold text-[#f3d886]">{nextGame ? gameName(nextGame) : 'Please wait'}</div>
          <div className="mt-1 text-sm text-slate-400">{nextGame?.resultTime || 'Schedule update हो रहा है'}</div>
          <Countdown time={nextGame?.resultTime} tick={tick} />
          <p className="mt-4 rounded-xl border border-[#d5b66f]/15 bg-[#d5b66f]/10 p-4 text-xs leading-5 text-[#d8cba8]">नया market result आते ही page automatically refresh हो जाएगा।</p>
        </div>
      </div>
    </motion.section>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <motion.div className="min-w-32 rounded-xl border border-white/10 bg-white/[0.05] p-3" whileHover={{ y: -4, scale: 1.03, borderColor: 'rgba(213,182,111,.45)' }} transition={{ type: 'spring', stiffness: 280 }}><div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[.15em] text-slate-500"><motion.span className="[&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:text-[#d5b66f]" whileHover={{ rotate: 12 }}>{icon}</motion.span>{label}</div><strong className="mt-2 block text-sm">{value}</strong></motion.div>;
}

function Countdown({ time, tick }: { time?: string | null; tick: number }) {
  const value = useMemo(() => duration(secondsUntil(time)), [time, tick]);
  return <motion.div className="royal-countdown mt-6 rounded-2xl border border-[#d5b66f]/20 bg-black/25 p-5" animate={{ boxShadow: ['0 0 0 rgba(244,211,94,0)', '0 0 28px rgba(244,211,94,.1)', '0 0 0 rgba(244,211,94,0)'] }} transition={{ duration: 2.8, repeat: Infinity }}><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.2em] text-slate-500"><motion.span animate={{ rotate: [0, 12, 0] }} transition={{ duration: 2, repeat: Infinity }}><TimerReset className="h-4 w-4 text-[#d5b66f]" /></motion.span> Time remaining</div><motion.div key={value} className="royal-number mt-2 font-mono text-3xl font-black tracking-wide text-[#f4d35e]" initial={{ opacity: 0.72 }} animate={{ opacity: 1 }}>{value}</motion.div></motion.div>;
}

function SectionTitle({ icon, eyebrow, title }: { icon: React.ReactNode; eyebrow: string; title: string }) {
  return <motion.div className="mb-5 flex items-end gap-3" initial={{ opacity: 0, x: -28 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: 0.55 }}><motion.div className="grid h-11 w-11 place-items-center rounded-xl border border-[#d5b66f]/25 bg-[#d5b66f]/10 text-[#e7c875] [&>svg]:h-5 [&>svg]:w-5" whileHover={{ rotate: 8, scale: 1.1 }} transition={{ type: 'spring' }}>{icon}</motion.div><div><div className="text-[9px] font-black uppercase tracking-[.25em] text-[#b99c58]">{eyebrow}</div><h2 className="mt-1 font-serif text-3xl font-black">{title}</h2></div></motion.div>;
}

function Upcoming({ games, tick, loading }: { games: Game[]; tick: number; loading: boolean }) {
  return <motion.section className="mt-12" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.08 }}><SectionTitle icon={<CalendarDays />} eyebrow="Today's schedule" title="Upcoming Markets" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{(loading ? Array.from({ length: 8 }) : games).map((game, index) => game ? <motion.div key={game._id || index} className={`rounded-2xl border ${royal.soft} p-4`} initial={{ opacity: 0, y: 30, scale: 0.94 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} transition={{ delay: index * 0.055, duration: 0.45 }} whileHover={{ y: -7, scale: 1.025, borderColor: 'rgba(213,182,111,.45)' }}><div className="flex items-start justify-between gap-2"><div><h3 className="font-serif text-lg font-bold">{gameName(game)}</h3><p className="mt-1 text-xs text-slate-500">Result time: {game.resultTime || 'Update soon'}</p></div><Status active={Boolean(game.hasResult)} /></div><motion.div className="mt-5 rounded-xl border border-[#d5b66f]/15 bg-[#080c17] p-4" whileHover={{ backgroundColor: 'rgba(213,182,111,.08)' }}><span className="text-[9px] font-bold uppercase tracking-[.18em] text-slate-600">Time remaining</span><div className="mt-1 font-mono text-xl font-black text-[#f4d35e]">{duration(secondsUntil(game.resultTime))}</div></motion.div></motion.div> : <Skeleton key={index} />)}</div></motion.section>;
}

function MarketBoard({ games, loading, onChart }: { games: Game[]; loading: boolean; onChart: (name: string) => void }) {
  return <motion.section className="mt-12" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}><SectionTitle icon={<Trophy />} eyebrow="All markets" title="Live Market Board" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{(loading ? Array.from({ length: 8 }) : games).map((game, index) => game ? <motion.article key={game._id || index} className={`group rounded-2xl border ${royal.soft} p-5`} initial={{ opacity: 0, y: 35, rotateX: 8 }} whileInView={{ opacity: 1, y: 0, rotateX: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05, duration: 0.5 }} whileHover={{ y: -8, scale: 1.025, borderColor: 'rgba(213,182,111,.48)' }}><div className="flex items-start justify-between"><div><h3 className="font-serif text-xl font-bold">{gameName(game)}</h3><div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><Clock3 className="h-3.5 w-3.5 text-[#d5b66f]" />{game.resultTime || 'Update soon'}</div></div><motion.div whileHover={{ rotate: 12, scale: 1.2 }}><ChartNoAxesColumnIncreasing className="h-5 w-5 text-[#d5b66f]" /></motion.div></div><div className="mt-7 text-[9px] font-bold uppercase tracking-[.2em] text-slate-600">Current result</div><div className="mt-2 flex items-end justify-between"><motion.div key={resultText(game)} className="font-serif text-5xl font-black text-[#f4d35e]" initial={{ scale: 0.7 }} animate={{ scale: 1 }}>{resultText(game)}</motion.div><Status active={Boolean(game.hasResult)} /></div><motion.button onClick={() => onChart(gameName(game))} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#d5b66f]/20 bg-[#d5b66f]/10 text-xs font-black text-[#f1d991]" whileHover={{ scale: 1.03, backgroundColor: '#d5b66f', color: '#071020' }} whileTap={{ scale: 0.96 }}><ChartNoAxesColumnIncreasing className="h-4 w-4" /> Chart / History</motion.button></motion.article> : <Skeleton key={index} />)}</div></motion.section>;
}

function Status({ active }: { active: boolean }) {
  return <motion.span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${active ? 'bg-emerald-400/15 text-emerald-400' : 'bg-[#d5b66f]/15 text-[#e7c875]'}`} animate={active ? { boxShadow: ['0 0 0 rgba(52,211,153,0)', '0 0 16px rgba(52,211,153,.28)', '0 0 0 rgba(52,211,153,0)'] } : { opacity: [0.72, 1, 0.72] }} transition={{ duration: 2.2, repeat: Infinity }}>{active ? 'Published' : 'Pending'}</motion.span>;
}

function Skeleton() { return <div className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.04] p-5"><div className="h-5 w-2/3 rounded bg-white/10" /><div className="mt-3 h-3 w-1/2 rounded bg-white/10" /><div className="mt-8 h-14 rounded bg-white/10" /></div>; }

function HistoryTable({ rows }: { rows: HistoryRow[] }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'pending'>('all');
  const [page, setPage] = useState(1);
  const filtered = rows.filter((row) => `${row.market} ${row.result} ${row.date}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'all' || row.status === filter));
  const totalPages = Math.max(1, Math.ceil(filtered.length / 5));
  const activePage = Math.min(page, totalPages);
  const visible = filtered.slice((activePage - 1) * 5, activePage * 5);
  return <section id="history" className="mt-12"><SectionTitle icon={<History />} eyebrow="Records" title="Result History" /><div className={`rounded-3xl border ${royal.panel} p-4 sm:p-6`}><div className="grid gap-3 md:grid-cols-[1fr_auto]"><label className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-[#080c17] px-4"><Search className="h-4 w-4 text-[#d5b66f]" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Market, date या number search करें" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600" /></label><div className="grid grid-cols-3 rounded-xl border border-white/10 bg-[#080c17] p-1">{(['all', 'published', 'pending'] as const).map((item) => <button key={item} onClick={() => { setFilter(item); setPage(1); }} className={`rounded-lg px-4 py-2 text-[10px] font-black capitalize ${filter === item ? 'bg-[#d5b66f] text-[#071020]' : 'text-slate-400'}`}>{item}</button>)}</div></div><div className="mt-4 overflow-x-auto rounded-xl border border-white/10"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-[#d5b66f]/10 text-[9px] uppercase tracking-[.18em] text-[#d8c48f]"><tr><th className="px-4 py-4">Date</th><th className="px-4 py-4">Market</th><th className="px-4 py-4">Result</th><th className="px-4 py-4">Status</th></tr></thead><tbody className="divide-y divide-white/5">{visible.map((row) => <tr key={row.id} className="bg-[#080c17]/50"><td className="px-4 py-4 text-slate-400">{row.date}</td><td className="px-4 py-4 font-serif font-bold">{row.market}</td><td className="px-4 py-4 font-mono text-xl font-black text-[#f4d35e]">{row.result}</td><td className="px-4 py-4"><Status active={row.status === 'published'} /></td></tr>)}</tbody></table></div><div className="mt-4 flex items-center justify-between text-xs text-slate-500"><span>Page {activePage} / {totalPages}</span><div className="flex gap-2"><button disabled={activePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button><button disabled={activePage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></div></div></div></section>;
}

function Footer() {
  return <footer id="contact" className="relative border-t border-[#d5b66f]/15 bg-[#050811] px-4 py-12"><div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_auto] md:items-end"><div><div className="flex items-center gap-2 font-serif text-2xl font-bold text-[#f3d886]"><Crown className="h-5 w-5" /> 555 Royal Live</div><p className="mt-3 max-w-2xl text-xs leading-6 text-slate-500">यह website market results केवल information के लिए दिखाती है। जिम्मेदारी से use करें। केवल 18+। Gambling की लत लग सकती है।</p><div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500"><span>Privacy Policy</span><span>Terms & Conditions</span><span>Responsible Gaming</span><Link className="text-[#d5b66f]" to="/archives">Old Records</Link></div></div><div className="flex gap-3"><a href="https://t.me/" className="flex h-12 items-center gap-2 rounded-xl border border-[#d5b66f]/25 bg-[#d5b66f]/10 px-4 text-sm font-bold text-[#ead69c]"><Bell className="h-4 w-4" /> Telegram</a><a href="https://wa.me/" className="flex h-12 items-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-bold text-[#071020]"><MessageCircle className="h-4 w-4" /> WhatsApp</a></div></div></footer>;
}

function MobileNav() {
  return <nav className="fixed bottom-3 left-3 right-3 z-40 grid grid-cols-3 rounded-2xl border border-[#d5b66f]/20 bg-[#090e1d]/95 p-2 shadow-2xl backdrop-blur-xl md:hidden"><a href="#top" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#d5b66f] text-xs font-black text-[#071020]"><Home className="h-4 w-4" /> Home</a><a href="#live" className="flex h-12 items-center justify-center gap-2 text-xs font-bold text-slate-300"><Radio className="h-4 w-4" /> Live</a><a href="#history" className="flex h-12 items-center justify-center gap-2 text-xs font-bold text-slate-300"><History className="h-4 w-4" /> History</a></nav>;
}

function buildHistoryRows(games: Game[]): HistoryRow[] {
  const date = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());
  return games.map((game, index) => ({ id: game._id || `${gameName(game)}-${index}`, date: game.formattedDate || (game.resultDate ? formatGameDate(game.resultDate) : date), market: gameName(game), result: resultText(game), status: game.hasResult ? 'published' : 'pending' }));
}
