import { Trophy, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import AdminDashboardV2 from './components/AdminDashboardV2';
import AdminUsersPage from './components/AdminUsersPage';
import LatestUpdates from './components/LatestUpdates';
import CreateGame from './components/CreateGame';
import GameResult from './components/GameResult';
import GameChart from './components/GameChart';
import GameResultsPage from './components/GameResultsPage';
import ProtectedRoute from './components/ProtectedRoute';
import ArchivesPage from './components/ArchivesPage';
import VisitorReportPage from './components/VisitorReportPage';
import { formatGameDate, getDisawarDisplayDate } from './utils/timezone';

// Session: active from 3:15 PM IST to 9:00 AM IST next day.
// Dead zone: 9:00 AM IST to 3:14 PM IST — show all games as loading.

const getISTHoursMinutes = (): { hours: number; minutes: number } => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(new Date());
  return {
    hours: parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10),
    minutes: parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10),
  };
};

// Returns true during the dead zone: 9:00 AM to 3:14 PM IST
const isInDeadZone = (): boolean => {
  const { hours, minutes } = getISTHoursMinutes();
  const totalMinutes = hours * 60 + minutes;
  const deadStart = 9 * 60;       // 9:00 AM
  const deadEnd = 15 * 60 + 14;   // 3:14 PM (session starts at 3:15 PM)
  return totalMinutes >= deadStart && totalMinutes <= deadEnd;
};

const getResultTimeSortValue = (resultTime?: string | null) => {
  if (!resultTime || typeof resultTime !== 'string') {
    return Number.MAX_SAFE_INTEGER;
  }

  const match = resultTime.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();

  if (meridiem === 'AM' && hours === 12) {
    hours = 0;
  } else if (meridiem === 'PM' && hours !== 12) {
    hours += 12;
  }

  const totalMinutes = (hours * 60) + minutes;

  // Early morning games (before 9 AM) sort after late-night games
  if (hours < 9) {
    return totalMinutes + (24 * 60);
  }

  // Session games start at 3:15 PM (15:15)
  if (hours > 15 || (hours === 15 && minutes >= 15)) {
    return totalMinutes;
  }

  return Number.MAX_SAFE_INTEGER;
};

const getDeclarationTimeSortValue = (resultTime?: string | null) => {
  if (!resultTime || typeof resultTime !== 'string') {
    return Number.MAX_SAFE_INTEGER;
  }

  const match = resultTime.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();

  if (meridiem === 'AM' && hours === 12) {
    hours = 0;
  } else if (meridiem === 'PM' && hours !== 12) {
    hours += 12;
  }

  return (hours * 60) + minutes;
};

const isDisawarGame = (game: any): boolean =>
  String(game?.nickName || game?.name || '').trim().toLowerCase() === 'disawar';

const sortGamesByDeclarationTime = (games: any[]) => [...games].sort((a: any, b: any) => {
  const disawarOrder = Number(isDisawarGame(a)) - Number(isDisawarGame(b));
  if (disawarOrder !== 0) {
    return disawarOrder;
  }

  const timeDiff = getDeclarationTimeSortValue(a.resultTime) - getDeclarationTimeSortValue(b.resultTime);
  if (timeDiff !== 0) {
    return timeDiff;
  }

  return String(a.nickName || a.name || '').localeCompare(String(b.nickName || b.name || ''));
});

const getCurrentISTGameTimeSortValue = () => {
  const { hours, minutes } = getISTHoursMinutes();
  const totalMinutes = (hours * 60) + minutes;

  if (hours < 9) {
    return totalMinutes + (24 * 60);
  }

  if (hours >= 15) {
    return totalMinutes;
  }

  return 0;
};

// Returns the IST calendar date (YYYY-MM-DD) when the current session started.
// Between 12:00 AM and 9:00 AM IST we are still in yesterday's session.
const getSessionStartDateIST = (): string => {
  const { hours } = getISTHoursMinutes();
  const d = new Date();
  // Before 9 AM we are in the previous day's session
  if (hours < 9) d.setDate(d.getDate() - 1);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d); // YYYY-MM-DD
};

const getISTDateKey = (date: Date): string => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);

const isLatestResultCurrent = (latestResult: any, now: Date): boolean => {
  if (!latestResult) return false;

  const { hours } = (() => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      hour12: false
    }).formatToParts(now);
    return { hours: Number(parts.find((part) => part.type === 'hour')?.value || 0) };
  })();

  // Until 10 AM, retain the final result from the previous overnight session.
  if (hours < 10) return true;

  // From 10 AM onward, an entry is visible only when its actual result date is today in IST.
  // createdAt/postedAt cannot be used here because an old result may be edited or imported today.
  const resultDateValue = latestResult.publishDate || latestResult.date;
  if (!resultDateValue) return false;
  const resultDate = new Date(resultDateValue);
  return !Number.isNaN(resultDate.getTime()) && getISTDateKey(resultDate) === getISTDateKey(now);
};

const isResultForCurrentSession = (game: any, sessionDate: string): boolean => {
  if (!game.resultDate) return false;
  const displayDate = getDisawarDisplayDate(game.resultDate, game.nickName || '');
  const resultDisplayDateIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' })
    .format(new Date(displayDate));
  return resultDisplayDateIST === sessionDate;
};

function HomePage() {
  const [todaysResults, setTodaysResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGameForChart, setSelectedGameForChart] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<any>(null);
  const [todayGameDate, setTodayGameDate] = useState<string>('');
  const [sessionDateYYYYMMDD, setSessionDateYYYYMMDD] = useState<string>(() => getSessionStartDateIST());
  const [currentTimeMarker, setCurrentTimeMarker] = useState(() => Date.now());
  const [deadZone, setDeadZone] = useState(() => isInDeadZone());
  const isFirstLoad = useRef(true);
  const sortedResults = sortGamesByDeclarationTime(todaysResults);
  const currentISTGameTime = getCurrentISTGameTimeSortValue();
  const nextUpcomingGame = deadZone
    ? null
    : sortedResults.find((game: any) => {
        const sv = getResultTimeSortValue(game.resultTime);
        return sv !== Number.MAX_SAFE_INTEGER && sv >= currentISTGameTime && !game.hasResult;
      }) || null;
  const visibleLatestResult = isLatestResultCurrent(latestResult, new Date(currentTimeMarker))
    ? latestResult
    : null;

  useEffect(() => {
    fetch('/api/visitors/visit', { method: 'POST', credentials: 'same-origin' })
      .then((response) => {
        if (!response.ok) throw new Error('Failed to register visit');
      })
      .catch((visitError) => console.error('Visitor counter unavailable:', visitError));

    const fetchData = async () => {
      try {
        if (isFirstLoad.current) {
          setLoading(true);
        }

        console.log('TIMEZONE DEBUG INFO');
        console.log('Browser Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
        console.log('Current UTC Time:', new Date().toISOString());
        console.log('Local Time String:', new Date().toLocaleString());
        console.log('Local Time Zone Offset:', new Date().getTimezoneOffset(), 'minutes');
        console.log('IST (Asia/Kolkata) Time:', new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

        const [gamesResponse, latestResultResponse] = await Promise.all([
          fetch('/api/games'),
          fetch('/api/games/latest-result')
        ]);

        if (!gamesResponse.ok || !latestResultResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const gamesData = await gamesResponse.json();
        const latestResultData = await latestResultResponse.json();

        console.log('BACKEND TIMEZONE INFO');
        console.log('todayGameDate from API:', gamesData.todayGameDate);
        console.log('todayDateIST from API:', gamesData.todayDateIST);
        console.log('todayDateIST_YYYYMMDD from API:', gamesData.todayDateIST_YYYYMMDD);
        console.log('filteringRange from API:', gamesData.filteringRange);

        console.log('FRONTEND GAMES DATA DEBUG');
        console.log('gamesData.games:', gamesData.games);
        console.log('gamesData.gamesWithResults:', gamesData.gamesWithResults);
        console.log('gamesData.todayGameDate:', gamesData.todayGameDate);
        console.log('gamesData.todayDateIST:', gamesData.todayDateIST);
        console.log('gamesData.todayDateIST_YYYYMMDD:', gamesData.todayDateIST_YYYYMMDD);

        setTodaysResults(gamesData.games || []);
        setTodayGameDate(gamesData.todayGameDate || gamesData.todayDateIST || 'Today');
        if (gamesData.todayDateIST_YYYYMMDD) {
          setSessionDateYYYYMMDD(gamesData.todayDateIST_YYYYMMDD);
        }
        setLatestResult(latestResultData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
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
      console.log('[SSE] Connecting to event stream...');
      eventSource = new EventSource('/api/events/subscribe');

      eventSource.onopen = () => {
        console.log('[SSE] Connection established');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[SSE] Event received:', data.type);

          if (
            data.type === 'result-posted' ||
            data.type === 'game-created' ||
            data.type === 'game-updated' ||
            data.type === 'game-deleted'
          ) {
            console.log('[SSE] Triggering data refresh for:', data.type);
            fetchData();
          }
        } catch (err) {
          // Ignore heartbeat messages and parsing errors
        }
      };

      eventSource.onerror = () => {
        console.error('[SSE] Connection error, will reconnect...');
        eventSource?.close();
        eventSource = null;
        reconnectTimeout = setTimeout(connectToSSE, 5000);
      };
    };

    connectToSSE();

    const clockInterval = setInterval(() => {
      setCurrentTimeMarker(Date.now());
      setDeadZone(isInDeadZone());
    }, 30000);

    return () => {
      if (eventSource) {
        console.log('[SSE] Closing connection');
        eventSource.close();
      }

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }

      clearInterval(clockInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      <header className="relative py-8 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 to-transparent"></div>
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-500 via-amber-600 to-yellow-700 rounded-full mb-4 shadow-xl border-4 border-yellow-400/30">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h1
              className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 mb-3"
              style={{ animation: 'glow 2s ease-in-out infinite' }}
            >
              SATTAKING999
            </h1>
            <div className="flex items-center justify-center gap-2 text-amber-400">
              <TrendingUp className="w-4 h-4" />
              <p className="text-sm font-semibold">Live Results & Fast Updates</p>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="container mx-auto px-4 mt-4">
          <div className="bg-red-900/40 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin-slow" />
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="ml-auto bg-red-500/20 hover:bg-red-500/40 px-3 py-1 rounded text-xs transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="mt-8">
        <LatestUpdates latestResult={visibleLatestResult} isLoading={loading} />
      </div>

      <main className="container mx-auto px-4 py-6 space-y-8">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-yellow-500 to-yellow-500 rounded"></div>
            <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Featured Games
            </h2>
            <div className="h-1 flex-1 bg-gradient-to-l from-transparent via-yellow-500 to-yellow-500 rounded"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8"></div>
        </section>

        <div className="bg-gradient-to-br from-amber-950/70 via-neutral-900 to-amber-950/70 rounded-xl p-6 border-2 border-yellow-600/40 shadow-xl">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-yellow-400 mb-2">Today's Results Board</h2>
            <p className="text-yellow-200 text-sm mb-2">{todayGameDate}</p>
            {!deadZone && (
              <div className="inline-block rounded-full bg-red-600 px-4 py-1 text-xs font-bold text-white">
                Live game status
              </div>
            )}
          </div>

          {!deadZone && nextUpcomingGame && (
            <div className="mb-6 rounded-xl border border-yellow-500/40 bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-red-500/10 p-4">
              <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-300">Next Game Announcement</p>
                  <h3 className="mt-1 text-2xl font-black text-white">{nextUpcomingGame.nickName}</h3>
                </div>
                <div className="rounded-lg bg-black/20 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-yellow-200">Result Time</p>
                  <p className="mt-1 text-lg font-bold text-yellow-400">{nextUpcomingGame.resultTime || 'Time not set'}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedResults.map((game: any, index: number) => {
              const isNextUpcomingGame = !deadZone && nextUpcomingGame?._id === game._id;
              // Published results must remain visible during the daytime dead zone.
              // The dead zone controls upcoming-game UI only; it must not override
              // the result state returned by the API.
              const showResult = game.hasResult && game.result && isResultForCurrentSession(game, sessionDateYYYYMMDD);

              return (
                <div
                  key={index}
                  className="bg-gradient-to-br from-neutral-950/80 to-amber-950/40 rounded-lg p-4 border border-yellow-600/30 transition-all duration-300 hover:scale-105 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-600/10"
                >
                  {isNextUpcomingGame && (
                    <div className="mb-3 flex justify-center">
                      <span className="rounded-full bg-red-600 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white animate-pulse shadow-lg shadow-red-900/40">
                        Upcoming
                      </span>
                    </div>
                  )}
                  <h4 className="text-yellow-400 font-bold text-center mb-1 text-sm">{game.nickName}</h4>
                  {game.resultTime && (
                    <p className="text-blue-400 text-xs text-center mb-2">Result Time: {game.resultTime}</p>
                  )}

                  {showResult ? (
                    <>
                      <div className="text-center">
                        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg py-3 px-6 mb-3 shadow-md">
                          <span className="text-white font-bold text-xl">{game.result}</span>
                        </div>
                        <button
                          onClick={() => setSelectedGameForChart(game.nickName)}
                          className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 hover:shadow-lg hover:shadow-red-600/50 transform hover:-translate-y-0.5"
                        >
                          View Chart
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg py-3 px-6 mb-3 shadow-md flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 text-yellow-300 animate-spin" />
                        <span className="text-white font-bold text-sm">{deadZone ? 'Waiting...' : 'Loading'}</span>
                      </div>
                      <button
                        onClick={() => setSelectedGameForChart(game.nickName)}
                        className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 hover:shadow-lg hover:shadow-red-600/50 transform hover:-translate-y-0.5"
                      >
                        View Chart
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {sortedResults.length === 0 && (
              <div className="col-span-full text-center text-gray-400 py-8">
                <p className="text-lg">No active games available</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-gradient-to-b from-transparent to-amber-950/30 py-8 mt-12 border-t border-yellow-600/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-3">
            <p className="text-yellow-400 font-semibold">© 2026 Sattaking999 Live Results. All Rights Reserved.</p>
            <p className="text-gray-500 text-sm">Play Responsibly | 18+ Only | Gambling Can Be Addictive</p>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
              <span>Terms & Conditions</span>
              <span>|</span>
              <span>Privacy Policy</span>
              <span>|</span>
              <span>Responsible Gaming</span>
              <span>|</span>
              <Link to="/archives" className="text-yellow-500 hover:text-yellow-400 transition-colors">
                Archives
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {selectedGameForChart && (
        <GameChart gameName={selectedGameForChart} onClose={() => setSelectedGameForChart(null)} />
      )}
    </div>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/archives" element={<ArchivesPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard-v2"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboardV2 />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/create-game"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CreateGame />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/edit-game/:gameId"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CreateGame />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/game-result/:gameId"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <GameResult />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/visitor-report"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <VisitorReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/game-results"
          element={
            <ProtectedRoute allowedRoles={['admin', 'subadmin', 'user']}>
              <GameResultsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
