import {
  Activity,
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  Clock3,
  History,
  Home,
  LineChart,
  MessageCircle,
  Phone,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy
} from 'lucide-react';
import { motion } from 'framer-motion';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
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

const sampleGames: Game[] = [
  { _id: 'sample-1', nickName: 'Delhi Bazar', result: '42', resultTime: '03:00 PM', hasResult: true },
  { _id: 'sample-2', nickName: 'Shri Ganesh', result: '18', resultTime: '04:20 PM', hasResult: true },
  { _id: 'sample-3', nickName: 'Faridabad', result: '77', resultTime: '05:50 PM', hasResult: true },
  { _id: 'sample-4', nickName: 'Ghaziabad', result: '29', resultTime: '08:40 PM', hasResult: true },
  { _id: 'sample-5', nickName: 'Gali', resultTime: '11:10 PM', hasResult: false },
  { _id: 'sample-6', nickName: 'Disawar', resultTime: '02:00 AM', hasResult: false }
];

function parseResultTimeToMinutes(time?: string | null) {
  if (!time) return Number.MAX_SAFE_INTEGER;

  const normalized = time.trim().toUpperCase().replace(/\s+/g, ' ');
  const match = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);

  if (!match) return Number.MAX_SAFE_INTEGER;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2] || '0', 10);
  const period = match[3];

  if (period === 'AM') {
    hours = hours === 12 ? 0 : hours;
  } else {
    hours = hours === 12 ? 12 : hours + 12;
  }

  const totalMinutes = hours * 60 + minutes;
  return totalMinutes < 6 * 60 ? totalMinutes + 24 * 60 : totalMinutes;
}

function getCurrentISTGameTimeSortValue() {
  const timeParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(new Date());

  const hours = parseInt(timeParts.find((part) => part.type === 'hour')?.value || '0', 10);
  const minutes = parseInt(timeParts.find((part) => part.type === 'minute')?.value || '0', 10);
  const totalMinutes = hours * 60 + minutes;

  if (hours < 6) return totalMinutes + 24 * 60;
  if (hours >= 14) return totalMinutes;
  return 0;
}

function sortGamesByResultTimeAsc<T extends { resultTime?: string | null; nickName?: string }>(games: T[]) {
  return [...games].sort((a, b) => {
    const timeDifference = parseResultTimeToMinutes(a.resultTime) - parseResultTimeToMinutes(b.resultTime);
    if (timeDifference !== 0) return timeDifference;
    return (a.nickName || '').localeCompare(b.nickName || '');
  });
}

function getGameName(game?: Game | null) {
  return game?.nickName || game?.name || game?.gameName || 'मार्केट';
}

function getResultText(game?: Game | null) {
  const result = game?.result;
  if (result === undefined || result === null || result === '') return '--';
  return String(result).padStart(2, '0');
}

function getSecondsUntilResult(time?: string | null) {
  const targetMinutes = parseResultTimeToMinutes(time);
  if (!Number.isFinite(targetMinutes) || targetMinutes === Number.MAX_SAFE_INTEGER) return 0;

  const nowMinutes = getCurrentISTGameTimeSortValue();
  const diffMinutes = targetMinutes >= nowMinutes ? targetMinutes - nowMinutes : targetMinutes + 24 * 60 - nowMinutes;
  return Math.max(0, diffMinutes * 60);
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getFilterLabel(filter: 'all' | 'published' | 'pending') {
  if (filter === 'all') return 'सभी';
  if (filter === 'published') return 'प्रकाशित';
  return 'लंबित';
}

function HomeDefault() {
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);
  const [todaysResults, setTodaysResults] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGameForChart, setSelectedGameForChart] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<Game | null>(null);
  const [todayGameDate, setTodayGameDate] = useState('आज');
  const [clockTick, setClockTick] = useState(() => Date.now());
  const isFirstLoad = useRef(true);

  const visibleGames = allGames.length ? allGames : sampleGames;
  const scheduledGames = useMemo(() => sortGamesByResultTimeAsc(visibleGames), [visibleGames]);
  const nextUpcomingGame =
    scheduledGames.find((game) => parseResultTimeToMinutes(game.resultTime) >= getCurrentISTGameTimeSortValue()) ||
    scheduledGames[0] ||
    null;
  const featuredResult = latestResult || todaysResults[0] || visibleGames.find((game) => game.hasResult) || sampleGames[0];
  const historyRows = useMemo(() => buildHistoryRows(todaysResults.length ? todaysResults : visibleGames), [todaysResults, visibleGames]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isFirstLoad.current) setLoading(true);

        const [gamesResponse, latestResultResponse] = await Promise.all([
          fetch('/api/games'),
          fetch('/api/games/latest-result')
        ]);

        if (!gamesResponse.ok || !latestResultResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const gamesData = await gamesResponse.json();
        const latestResultData = await latestResultResponse.json();

        setAllGames(sortGamesByResultTimeAsc(gamesData.games || []));
        setUpcomingGames(sortGamesByResultTimeAsc(gamesData.upcomingGames || []));
        setTodaysResults(sortGamesByResultTimeAsc(gamesData.gamesWithResults || []));
        setTodayGameDate(gamesData.todayGameDate || gamesData.todayDateIST || 'आज');
        setLatestResult(latestResultData);
        setError(null);
      } catch (fetchError) {
        console.error('Error fetching data:', fetchError);
        setError('लाइव फीड फिर से जुड़ रही है। अभी नमूना बोर्ड दिखाया जा रहा है।');
      } finally {
        if (isFirstLoad.current) {
          setLoading(false);
          isFirstLoad.current = false;
        }
      }
    };

    fetchData();

    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connectToSSE = () => {
      eventSource = new EventSource('/api/events/subscribe');

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (['result-posted', 'game-created', 'game-updated', 'game-deleted'].includes(data.type)) {
            fetchData();
          }
        } catch {
          // Heartbeat messages do not need UI handling.
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        reconnectTimeout = setTimeout(connectToSSE, 5000);
      };
    };

    connectToSSE();

    const clockInterval = setInterval(() => {
      setClockTick(Date.now());
    }, 1000);

    return () => {
      eventSource?.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      clearInterval(clockInterval);
    };
  }, []);

  return (
    <LayoutWrapper>
      <HeroSection
        latestResult={featuredResult}
        allGames={visibleGames}
        clockTick={clockTick}
        loading={loading}
      />

      {error && (
        <div className="mx-auto mt-4 max-w-7xl px-4">
          <div className="rounded-2xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-100 shadow-[0_0_32px_rgba(248,113,113,0.15)]">
            {error}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 md:pb-14">
        <LiveResultCard
          result={featuredResult}
          nextGame={nextUpcomingGame}
          todayGameDate={todayGameDate}
          loading={loading}
          clockTick={clockTick}
        />
        <UpcomingMarketsSection games={upcomingGames.length ? upcomingGames : scheduledGames.slice(0, 6)} clockTick={clockTick} />
        <MarketGrid games={visibleGames} loading={loading} onOpenChart={setSelectedGameForChart} />
        <HistoryTable rows={historyRows} />
        <AnalyticsCharts games={visibleGames} onOpenChart={setSelectedGameForChart} />
      </main>

      <Footer />
      <BottomNavigation />

      {selectedGameForChart && (
        <GameChart gameName={selectedGameForChart} onClose={() => setSelectedGameForChart(null)} />
      )}
    </LayoutWrapper>
  );
}

function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-hidden bg-[#0B0B0B] text-white [font-family:'Noto_Sans_Devanagari','Mangal','Kohinoor_Devanagari','Arial_Unicode_MS',system-ui,sans-serif]">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.22),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(250,204,21,0.13),transparent_28%),linear-gradient(135deg,#0B0B0B,#111827_52%,#050505)]" />
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:54px_54px] opacity-30" />
      <Particles />
      {children}
    </div>
  );
}

function Particles() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {Array.from({ length: 22 }).map((_, index) => (
        <motion.span
          key={index}
          className="absolute h-1 w-1 rounded-full bg-yellow-300/60 shadow-[0_0_18px_rgba(250,204,21,0.75)]"
          style={{
            left: `${(index * 37) % 100}%`,
            top: `${(index * 23) % 100}%`
          }}
          animate={{ y: [-12, 18, -12], opacity: [0.15, 0.85, 0.15], scale: [0.75, 1.45, 0.75] }}
          transition={{ duration: 4 + (index % 6), repeat: Infinity, ease: 'easeInOut', delay: index * 0.18 }}
        />
      ))}
    </div>
  );
}

function HeroSection({
  latestResult,
  allGames,
  clockTick,
  loading
}: {
  latestResult: Game;
  allGames: Game[];
  clockTick: number;
  loading: boolean;
}) {
  const liveClock = useMemo(() => {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(new Date(clockTick));
  }, [clockTick]);

  return (
    <header className="relative px-4 pb-5 pt-5 md:pt-8">
      <div className="mx-auto max-w-7xl">
        <nav className="flex items-center justify-between gap-4">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="relative grid h-12 w-12 place-items-center rounded-2xl border border-yellow-300/30 bg-yellow-300/10 shadow-[0_0_32px_rgba(212,175,55,0.34)]">
              <motion.div
                className="absolute inset-1 rounded-xl border border-yellow-200/20"
                animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2.2, repeat: Infinity }}
              />
              <Trophy className="h-6 w-6 text-yellow-300" />
            </div>
            <div>
              <div className="text-lg font-black tracking-wide text-yellow-200">555 Royal Live</div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-100/55">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
                लाइव फीड चालू
              </div>
            </div>
          </motion.div>

          <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-yellow-100/80 backdrop-blur md:flex">
            <Clock3 className="h-4 w-4 text-yellow-300" />
            <span>{liveClock} भारतीय समय</span>
          </div>
        </nav>

        <motion.div
          className="grid gap-6 pb-4 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.22em] text-yellow-200">
              <Sparkles className="h-4 w-4" />
              लाइव परिणाम और तेज अपडेट
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-7xl">
              प्रीमियम डार्क-गोल्ड डैशबोर्ड में लाइव मार्केट परिणाम, तेज और साफ।
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              मार्केट नंबर, पुराना रिकॉर्ड, समय-सारणी और चार्ट विश्लेषण, सब एक मोबाइल-फर्स्ट डैशबोर्ड में।
            </p>
          </div>

          <div className="rounded-[2rem] border border-yellow-300/20 bg-white/[0.055] p-4 shadow-[0_0_80px_rgba(212,175,55,0.18)] backdrop-blur-xl">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-yellow-100/55">
              <span>आज का मुख्य संकेत</span>
              <span className="flex items-center gap-1 text-emerald-300">
                <Radio className="h-3.5 w-3.5" />
                ऑनलाइन
              </span>
            </div>
            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <div className="text-2xl font-black text-yellow-200">{getGameName(latestResult)}</div>
                <div className="mt-1 text-sm text-slate-400">{latestResult.resultTime || latestResult.time || 'अपडेट हो रहा है'}</div>
              </div>
              <motion.div
                className="text-6xl font-black tabular-nums text-yellow-300 drop-shadow-[0_0_24px_rgba(250,204,21,0.5)]"
                animate={{ scale: loading ? [1, 1.03, 1] : [1, 1.08, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              >
                {loading ? '..' : getResultText(latestResult)}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
      <ResultTicker games={allGames} />
    </header>
  );
}

function ResultTicker({ games }: { games: Game[] }) {
  const tickerItems = (games.length ? games : sampleGames).map((game) => `${getGameName(game)} ${getResultText(game)}`);
  const tickerText = [...tickerItems, ...tickerItems].join('   |   ');

  return (
    <div className="relative mt-3 overflow-hidden border-y border-yellow-300/15 bg-black/45 py-3">
      <motion.div
        className="whitespace-nowrap text-sm font-bold uppercase tracking-[0.16em] text-yellow-100/80"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
      >
        {tickerText}
      </motion.div>
    </div>
  );
}

function LiveResultCard({
  result,
  nextGame,
  todayGameDate,
  loading,
  clockTick
}: {
  result: Game;
  nextGame: Game | null;
  todayGameDate: string;
  loading: boolean;
  clockTick: number;
}) {
  return (
    <motion.section
      id="live"
      className="relative rounded-[2rem] border border-yellow-300/20 bg-gradient-to-br from-white/[0.09] via-white/[0.045] to-yellow-500/[0.08] p-5 shadow-[0_0_100px_rgba(212,175,55,0.18)] backdrop-blur-xl md:p-7"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="absolute inset-0 rounded-[2rem] border border-yellow-200/10 shadow-[inset_0_0_45px_rgba(250,204,21,0.08)]" />
      <div className="relative grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-emerald-300">
                <motion.span
                  className="h-2.5 w-2.5 rounded-full bg-emerald-300"
                  animate={{ boxShadow: ['0 0 0 0 rgba(52,211,153,0.7)', '0 0 0 10px rgba(52,211,153,0)'] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                लाइव परिणाम
              </div>
              <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">{getGameName(result)}</h2>
            </div>
            <div className="rounded-2xl border border-yellow-300/20 bg-black/30 px-4 py-3 text-right">
              <div className="text-xs uppercase tracking-[0.2em] text-yellow-100/45">अपडेट समय</div>
              <div className="mt-1 text-sm font-bold text-yellow-100">
                {result.formattedDate || (result.resultDate ? formatGameDate(result.resultDate) : todayGameDate)}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end">
            <motion.div
              key={getResultText(result)}
              className="text-[6rem] font-black leading-none text-yellow-300 drop-shadow-[0_0_34px_rgba(250,204,21,0.6)] md:text-[9rem]"
              initial={{ opacity: 0, scale: 0.82, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 140, damping: 14 }}
            >
              {loading ? '--' : getResultText(result)}
            </motion.div>
            <div className="mb-2 grid grid-cols-2 gap-3 sm:min-w-64">
              <MetricPill label="परिणाम समय" value={result.resultTime || result.time || 'लाइव'} icon={<Clock3 className="h-4 w-4" />} />
              <MetricPill label="स्थिति" value="सत्यापित" icon={<ShieldCheck className="h-4 w-4" />} />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-yellow-300/15 bg-[#0B0B0B]/65 p-5">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-100/50">अगला परिणाम</div>
          <div className="mt-3 text-2xl font-black text-yellow-200">{nextGame ? getGameName(nextGame) : 'प्रतीक्षा'}</div>
          <div className="mt-1 text-sm text-slate-400">{nextGame?.resultTime || 'समय-सारणी अपडेट हो रही है'}</div>
          <CountdownTimer targetTime={nextGame?.resultTime || null} clockTick={clockTick} />
          <div className="mt-5 rounded-2xl bg-yellow-300/10 p-4 text-sm text-yellow-50/75">
            लाइव सर्वर पर नया मार्केट अपडेट आते ही परिणाम अपने आप रिफ्रेश हो जाएगा।
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function MetricPill({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-yellow-100/45">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-lg font-black text-white">{value}</div>
    </div>
  );
}

function CountdownTimer({ targetTime, clockTick }: { targetTime?: string | null; clockTick: number }) {
  const seconds = useMemo(() => getSecondsUntilResult(targetTime), [targetTime, clockTick]);

  return (
    <div className="mt-5 rounded-2xl border border-yellow-300/20 bg-black/40 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-yellow-100/45">बचा हुआ समय</div>
      <div className="mt-2 font-mono text-3xl font-black text-yellow-300">{formatDuration(seconds)}</div>
    </div>
  );
}

function UpcomingMarketsSection({ games, clockTick }: { games: Game[]; clockTick: number }) {
  return (
    <section className="mt-7">
      <SectionHeader
        eyebrow="समय-सारणी"
        title="आने वाले मार्केट"
        action={<span className="text-xs text-yellow-100/50">मोबाइल पर स्वाइप करें</span>}
      />
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 lg:grid-cols-4">
        {games.slice(0, 8).map((game, index) => (
          <motion.div
            key={game._id || `${getGameName(game)}-${index}`}
            className="min-w-[78vw] snap-start rounded-3xl border border-yellow-300/15 bg-white/[0.055] p-4 backdrop-blur-xl transition hover:-translate-y-1 hover:border-yellow-300/35 hover:shadow-[0_0_42px_rgba(212,175,55,0.16)] md:min-w-0"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.04 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-black text-white">{getGameName(game)}</div>
                <div className="mt-1 text-sm text-slate-400">परिणाम समय {game.resultTime || 'जल्द अपडेट'}</div>
              </div>
              <StatusBadge status={game.hasResult ? 'published' : 'pending'} />
            </div>
            <CountdownTimer targetTime={game.resultTime || null} clockTick={clockTick} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function MarketGrid({ games, loading, onOpenChart }: { games: Game[]; loading: boolean; onOpenChart: (gameName: string) => void }) {
  return (
    <section className="mt-9">
      <SectionHeader eyebrow="मार्केट" title="लाइव मार्केट बोर्ड" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(loading ? Array.from({ length: 8 }) : games).map((game, index) => (
          <MarketCard
            key={(game as Game)?._id || index}
            game={game as Game | undefined}
            loading={loading}
            index={index}
            onOpenChart={onOpenChart}
          />
        ))}
      </div>
    </section>
  );
}

function MarketCard({
  game,
  loading,
  index,
  onOpenChart
}: {
  game?: Game;
  loading: boolean;
  index: number;
  onOpenChart: (gameName: string) => void;
}) {
  if (loading || !game) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <SkeletonBlock />
      </div>
    );
  }

  return (
    <motion.article
      className="group rounded-3xl border border-yellow-300/15 bg-gradient-to-br from-white/[0.075] to-white/[0.025] p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-yellow-300/40 hover:shadow-[0_0_48px_rgba(212,175,55,0.18)]"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.035 }}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-xl font-black text-white">{getGameName(game)}</h3>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
            <Clock3 className="h-4 w-4 text-yellow-300" />
            {game.resultTime || 'जल्द अपडेट'}
          </div>
        </div>
        <div className="rounded-2xl bg-yellow-300/10 p-2 text-yellow-300">
          <LineChart className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-yellow-100/45">अभी का परिणाम</div>
          <div className="mt-1 text-5xl font-black text-yellow-300 drop-shadow-[0_0_20px_rgba(250,204,21,0.45)]">
            {getResultText(game)}
          </div>
        </div>
        <TrendIndicator active={Boolean(game.hasResult)} />
      </div>

      <button
        type="button"
        onClick={() => onOpenChart(getGameName(game))}
        className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 px-4 text-sm font-black text-yellow-100 transition hover:bg-yellow-300 hover:text-black"
      >
        <BarChart3 className="h-4 w-4" />
        चार्ट / इतिहास
      </button>
    </motion.article>
  );
}

function TrendIndicator({ active }: { active: boolean }) {
  return (
    <div className={`rounded-full px-3 py-1.5 text-xs font-black ${active ? 'bg-emerald-400/15 text-emerald-300' : 'bg-amber-400/15 text-amber-200'}`}>
      {active ? '+ सक्रिय' : 'लंबित'}
    </div>
  );
}

function HistoryTable({ rows }: { rows: HistoryRow[] }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'pending'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const filteredRows = rows.filter((row) => {
    const matchesQuery = `${row.market} ${row.result} ${row.date}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === 'all' || row.status === filter;
    return matchesQuery && matchesFilter;
  });
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const activePage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((activePage - 1) * pageSize, activePage * pageSize);

  return (
    <section id="history" className="mt-9">
      <SectionHeader eyebrow="रिकॉर्ड" title="परिणाम इतिहास" />
      <div className="rounded-[2rem] border border-yellow-300/15 bg-white/[0.055] p-4 backdrop-blur-xl md:p-6">
        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-white/10 bg-black/35 px-4">
            <Search className="h-5 w-5 text-yellow-300" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              placeholder="मार्केट, तारीख या नंबर खोजें"
            />
          </div>
          <div className="grid grid-cols-3 rounded-2xl border border-white/10 bg-black/35 p-1">
            {(['all', 'published', 'pending'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setFilter(item);
                  setPage(1);
                }}
                className={`min-h-10 rounded-xl px-3 text-xs font-black capitalize transition ${
                  filter === item ? 'bg-yellow-300 text-black' : 'text-slate-300 hover:text-yellow-200'
                }`}
              >
                {getFilterLabel(item)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-yellow-300/10 text-xs uppercase tracking-[0.18em] text-yellow-100/60">
              <tr>
                <th className="px-4 py-4">तारीख</th>
                <th className="px-4 py-4">मार्केट</th>
                <th className="px-4 py-4">परिणाम नंबर</th>
                <th className="px-4 py-4">स्थिति</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {pageRows.map((row) => (
                <tr key={row.id} className="bg-black/20 transition hover:bg-yellow-300/5">
                  <td className="px-4 py-4 text-slate-300">{row.date}</td>
                  <td className="px-4 py-4 font-bold text-white">{row.market}</td>
                  <td className="px-4 py-4 font-mono text-xl font-black text-yellow-300">{row.result}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            पेज {activePage} / {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/30 text-yellow-200 disabled:opacity-40"
              disabled={activePage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/30 text-yellow-200 disabled:opacity-40"
              disabled={activePage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function AnalyticsCharts({ games, onOpenChart }: { games: Game[]; onOpenChart: (gameName: string) => void }) {
  const marketNames = games.slice(0, 6).map(getGameName);
  const resultValues = games.slice(0, 6).map((game, index) => Number(game.result) || 18 + index * 9);
  const weeklyOptions: ApexOptions = {
    chart: { type: 'area', toolbar: { show: false }, foreColor: '#CBD5E1', background: 'transparent' },
    theme: { mode: 'dark' },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3, colors: ['#FACC15'] },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.42, opacityTo: 0.03, stops: [0, 90, 100] }
    },
    grid: { borderColor: 'rgba(255,255,255,0.08)' },
    xaxis: { categories: marketNames, labels: { style: { colors: '#94A3B8' } } },
    yaxis: { labels: { style: { colors: '#94A3B8' } } },
    colors: ['#FACC15'],
    tooltip: { theme: 'dark' }
  };
  const monthlyOptions: ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false }, foreColor: '#CBD5E1', background: 'transparent' },
    theme: { mode: 'dark' },
    plotOptions: { bar: { borderRadius: 8, columnWidth: '45%' } },
    dataLabels: { enabled: false },
    grid: { borderColor: 'rgba(255,255,255,0.08)' },
    xaxis: { categories: marketNames, labels: { style: { colors: '#94A3B8' } } },
    yaxis: { labels: { style: { colors: '#94A3B8' } } },
    colors: ['#D4AF37'],
    tooltip: { theme: 'dark' }
  };

  return (
    <section id="charts" className="mt-9">
      <SectionHeader eyebrow="चार्ट" title="विश्लेषण डैशबोर्ड" />
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel title="साप्ताहिक परिणाम प्रवाह" icon={<Activity className="h-5 w-5" />}>
          <ReactApexChart options={weeklyOptions} series={[{ name: 'परिणाम', data: resultValues }]} type="area" height={300} />
        </ChartPanel>
        <ChartPanel title="मासिक मार्केट हीट" icon={<BarChart3 className="h-5 w-5" />}>
          <ReactApexChart options={monthlyOptions} series={[{ name: 'मार्केट हीट', data: resultValues.map((value) => value + 12) }]} type="bar" height={300} />
        </ChartPanel>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <InsightPanel title="सक्रिय मार्केट" games={games.filter((game) => game.hasResult).slice(0, 4)} onOpenChart={onOpenChart} />
        <InsightPanel title="ट्रेंडिंग मार्केट" games={[...games].slice(0, 4)} onOpenChart={onOpenChart} />
      </div>
    </section>
  );
}

function ChartPanel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-[2rem] border border-yellow-300/15 bg-white/[0.055] p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-yellow-300/10 text-yellow-300">{icon}</div>
        <h3 className="text-xl font-black text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InsightPanel({ title, games, onOpenChart }: { title: string; games: Game[]; onOpenChart: (gameName: string) => void }) {
  const visibleGames = games.length ? games : sampleGames.slice(0, 4);

  return (
    <div className="rounded-[2rem] border border-yellow-300/15 bg-white/[0.055] p-5 backdrop-blur-xl">
      <h3 className="mb-4 text-xl font-black text-white">{title}</h3>
      <div className="space-y-3">
        {visibleGames.map((game, index) => (
          <button
            key={game._id || `${title}-${index}`}
            type="button"
            onClick={() => onOpenChart(getGameName(game))}
            className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 text-left transition hover:border-yellow-300/30 hover:bg-yellow-300/10"
          >
            <span>
              <span className="block font-bold text-white">{getGameName(game)}</span>
              <span className="text-xs text-slate-400">{game.resultTime || 'लाइव चालू'}</span>
            </span>
            <span className="font-mono text-2xl font-black text-yellow-300">{getResultText(game)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function BottomNavigation() {
  const items = [
    { label: 'होम', icon: Home, href: '#' },
    { label: 'लाइव', icon: Radio, href: '#live' },
    { label: 'इतिहास', icon: History, href: '#history' },
    { label: 'चार्ट', icon: BarChart3, href: '#charts' },
    { label: 'संपर्क', icon: Phone, href: '#contact' }
  ];

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-40 rounded-3xl border border-yellow-300/20 bg-black/75 p-2 shadow-[0_0_42px_rgba(212,175,55,0.2)] backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href={item.href}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold ${
                index === 0 ? 'bg-yellow-300 text-black' : 'text-slate-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer id="contact" className="border-t border-yellow-300/15 bg-black/40 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="h-px bg-gradient-to-r from-transparent via-yellow-300/70 to-transparent" />
        <div className="grid gap-6 py-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="text-2xl font-black text-yellow-200">555 Royal Live</div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              यह वेबसाइट केवल जानकारी के लिए मार्केट परिणाम दिखाती है। जिम्मेदारी से उपयोग करें। 18+ केवल। जुआ लत लगा सकता है।
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
              <span>गोपनीयता नीति</span>
              <span>नियम और शर्तें</span>
              <span>जिम्मेदार गेमिंग</span>
              <Link to="/archives" className="text-yellow-300 hover:text-yellow-200">पुराना रिकॉर्ड</Link>
            </div>
          </div>
          <div className="flex gap-3">
            <a href="https://t.me/" className="flex min-h-12 items-center gap-2 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 px-4 font-black text-yellow-100">
              <Bell className="h-5 w-5" />
              Telegram
            </a>
            <a href="https://wa.me/" className="flex min-h-12 items-center gap-2 rounded-2xl bg-emerald-400 px-4 font-black text-black">
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </a>
          </div>
        </div>
        <div className="text-sm text-slate-500">कॉपीराइट 2026 555 Royal Live. सभी अधिकार सुरक्षित।</div>
      </div>
    </footer>
  );
}

function SectionHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <div className="text-xs font-black uppercase tracking-[0.24em] text-yellow-300/70">{eyebrow}</div>
        <h2 className="mt-1 text-2xl font-black text-white md:text-3xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function StatusBadge({ status }: { status: 'published' | 'pending' }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${
      status === 'published' ? 'bg-emerald-400/15 text-emerald-300' : 'bg-yellow-300/15 text-yellow-200'
    }`}>
      {status === 'published' ? 'प्रकाशित' : 'लंबित'}
    </span>
  );
}

function SkeletonBlock() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-5 w-2/3 rounded bg-white/10" />
      <div className="h-4 w-1/2 rounded bg-white/10" />
      <div className="h-14 w-full rounded-2xl bg-yellow-300/10" />
      <div className="h-11 w-full rounded-2xl bg-white/10" />
    </div>
  );
}

function buildHistoryRows(games: Game[]): HistoryRow[] {
  const date = new Intl.DateTimeFormat('hi-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  return games.map((game, index) => ({
    id: game._id || `${getGameName(game)}-${index}`,
    date: game.formattedDate || (game.resultDate ? formatGameDate(game.resultDate) : date),
    market: getGameName(game),
    result: getResultText(game),
    status: game.hasResult ? 'published' : 'pending'
  }));
}

export default HomeDefault;
