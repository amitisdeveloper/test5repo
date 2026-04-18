import { Phone, Trophy, TrendingUp, RefreshCw, BarChart3 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import GameChart from '../components/GameChart';
import { formatGameDate } from '../utils/timezone';

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

  let totalMinutes = hours * 60 + minutes;

  // Early-morning publish times belong to the end of the previous market cycle.
  if (totalMinutes < 6 * 60) {
    totalMinutes += 24 * 60;
  }

  return totalMinutes;
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
  const totalMinutes = (hours * 60) + minutes;

  if (hours < 6) {
    return totalMinutes + (24 * 60);
  }

  if (hours >= 14) {
    return totalMinutes;
  }

  return 0;
}

function sortGamesByResultTimeAsc<T extends { resultTime?: string | null }>(games: T[]) {
  return [...games].sort((a, b) => {
    const timeDifference = parseResultTimeToMinutes(a.resultTime) - parseResultTimeToMinutes(b.resultTime);

    if (timeDifference !== 0) {
      return timeDifference;
    }

    return (a as any).nickName?.localeCompare?.((b as any).nickName || '') || 0;
  });
}

function HomeDefault() {
  const [allGames, setAllGames] = useState<any[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<any[]>([]);
  const [todaysResults, setTodaysResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGameForChart, setSelectedGameForChart] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<any>(null);
  const [todayGameDate, setTodayGameDate] = useState<string>('');
  const [todayDateIST_YYYYMMDD, setTodayDateIST_YYYYMMDD] = useState<string>('');
  const [, setCurrentTimeMarker] = useState(() => Date.now());
  const isFirstLoad = useRef(true);
  const scheduledGames = sortGamesByResultTimeAsc(allGames);
  const currentISTGameTime = getCurrentISTGameTimeSortValue();
  const nextUpcomingGame =
    scheduledGames.find((game: any) => parseResultTimeToMinutes(game.resultTime) >= currentISTGameTime) ||
    scheduledGames[0] ||
    null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isFirstLoad.current) {
          setLoading(true);
        }
        
        // 🔍 TIMEZONE DEBUGGING - Show exact timezone info
        console.log('🕒 === TIMEZONE DEBUG INFO ===');
        console.log('Browser Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
        console.log('Current UTC Time:', new Date().toISOString());
        console.log('Local Time String:', new Date().toLocaleString());
        console.log('Local Time Zone Offset:', new Date().getTimezoneOffset(), 'minutes');
        console.log(' IST (Asia/Kolkata) Time:', new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        
        const [gamesResponse, latestResultResponse] = await Promise.all([
          fetch('/api/games'),
          fetch('/api/games/latest-result')
        ]);

        if (!gamesResponse.ok || !latestResultResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const gamesData = await gamesResponse.json();
        const latestResultData = await latestResultResponse.json();

        const sortedAllGames = sortGamesByResultTimeAsc(gamesData.games || []);
        const sortedUpcomingGames = sortGamesByResultTimeAsc(gamesData.upcomingGames || []);
        const sortedTodaysResults = sortGamesByResultTimeAsc(gamesData.gamesWithResults || []);

        // Store all games for the grid section
        setAllGames(sortedAllGames);

        // 🔍 API TIMEZONE DEBUGGING - Show backend timezone info
        console.log('🕒 === BACKEND TIMEZONE INFO ===');
        console.log('todayGameDate from API:', gamesData.todayGameDate);
        console.log('todayDateIST from API:', gamesData.todayDateIST);
        console.log('todayDateIST_YYYYMMDD from API:', gamesData.todayDateIST_YYYYMMDD);
        console.log('filteringRange from API:', gamesData.filteringRange);
        console.log('localWithResults count:', gamesData.localWithResults?.length || 0);
        console.log('todaysResults count:', gamesData.todaysResults?.length || 0);
        console.log('🕒 =========================');

        // Use the categorized games from the API response
        console.log('🕒 === FRONTEND GAMES DATA DEBUG ===');
        console.log('gamesData.upcomingGames:', gamesData.upcomingGames);
        console.log('gamesData.gamesWithResults:', gamesData.gamesWithResults);
        console.log('gamesData.todayGameDate:', gamesData.todayGameDate);
        console.log('gamesData.todayDateIST:', gamesData.todayDateIST);
        console.log('gamesData.todayDateIST_YYYYMMDD:', gamesData.todayDateIST_YYYYMMDD);
        console.log('gamesData.filteringRange:', gamesData.filteringRange);
        console.log('gamesData.localWithResults count:', gamesData.localWithResults?.length || 0);
        console.log('gamesData.todaysResults count:', gamesData.todaysResults?.length || 0);
        console.log('🕒 =========================');

        // Keep every home-page list ordered by published/result time ascending
        setUpcomingGames(sortedUpcomingGames);
        setTodaysResults(sortedTodaysResults);
        setTodayGameDate(gamesData.todayGameDate || gamesData.todayDateIST || 'Today');
        setTodayDateIST_YYYYMMDD(gamesData.todayDateIST_YYYYMMDD || '');

        // Set the latest result from the API
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
    
    // Connect to SSE for real-time updates
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
          if (data.type === 'result-posted' || data.type === 'game-created' || data.type === 'game-updated' || data.type === 'game-deleted') {
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
        
        // Attempt to reconnect after 5 seconds
        reconnectTimeout = setTimeout(connectToSSE, 5000);
      };
    };
    
    connectToSSE();

    const clockInterval = setInterval(() => {
      setCurrentTimeMarker(Date.now());
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
    <div className="min-h-screen text-[16px] md:text-[18px] lg:text-[19px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/40 via-neutral-950 to-neutral-950 text-white">
      {/* Local styles for glow + subtle grid */}
      <style>{`
        @keyframes softGlow {
          0%,100% { filter: drop-shadow(0 0 10px rgba(245,158,11,.25)); }
          50% { filter: drop-shadow(0 0 18px rgba(245,158,11,.55)); }
        }
        @keyframes numberGlow {
          0%,100% { text-shadow: 0 0 18px rgba(245,158,11,.35), 0 0 42px rgba(245,158,11,.15); }
          50% { text-shadow: 0 0 26px rgba(245,158,11,.65), 0 0 70px rgba(245,158,11,.25); }
        }
        @keyframes wave {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }
        .bg-grid {
          background-image:
            linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
          background-size: 44px 44px;
          background-position: center;
        }
      `}</style>

      {/* Header / Title (like image2 top) */}
      <header className="relative pt-10 pb-6 px-4">
        <div className="absolute inset-0 bg-grid opacity-[0.25]" />
        <div className="container mx-auto relative z-10 text-center">
          <div
            className="mx-auto mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full
            bg-gradient-to-br from-yellow-500 via-amber-600 to-yellow-700 border-4 border-yellow-400/25 shadow-xl"
            style={{ animation: "softGlow 2.4s ease-in-out infinite" }}
          >
            <Trophy className="h-10 w-10 text-white" />
          </div>

          <h1
            className="text-5xl md:text-6xl font-black text-transparent bg-clip-text
            bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500"
            style={{ animation: "numberGlow 2.4s ease-in-out infinite" }}
          >
            555 RESULTS
          </h1>

          <div className="mt-2 flex items-center justify-center gap-2 text-amber-300/90">
            <TrendingUp className="w-4 h-4" />
            <p className="text-sm font-semibold">Live Results & Fast Updates</p>
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
      </header>

      {/* Error banner (like image2) */}
      {error && (
        <div className="container mx-auto px-4 mt-2">
          <div className="bg-red-900/40 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <p className="text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="ml-auto bg-red-500/20 hover:bg-red-500/40 px-3 py-1 rounded text-xs transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* ===== Latest Result Hero ===== */}
      <section className="container mx-auto px-4 mt-6">
        <div className="rounded-2xl border border-yellow-600/25 bg-gradient-to-br from-neutral-900/70 via-neutral-950 to-amber-950/40 shadow-2xl overflow-hidden">
          <div className="p-5 md:p-7">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              {/* LEFT: LATEST RESULT — GAME NAME + published date/time */}
              

              {/* RIGHT: latest update time */}
              
            </div>

            {/* Center glowing number */}
            <div className="mt-6 flex items-center justify-center">
              <div className="flex w-full max-w-xl flex-col items-center justify-center rounded-2xl border border-yellow-500/30 bg-neutral-950/70 px-8 py-7 shadow-xl">
                {loading ? (
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="w-7 h-7 animate-spin text-yellow-400" />
                    <div className="text-xs text-yellow-200/70">Loading latest result…</div>
                  </div>
                ) : (
                  <>
                    <div
                      className="mb-2 text-center text-2xl md:text-3xl font-bold text-yellow-400"
                      style={{
                        textShadow: "0 0 10px rgba(255,204,0,0.8), 0 0 20px rgba(255,204,0,0.6)"
                      }}
                    >
                      {latestResult?.name || latestResult?.gameName || latestResult?.nickName || "-"}
                    </div>
                    <div className="text-center text-6xl md:text-7xl font-extrabold text-yellow-400"
                         style={{ animation: "numberGlow 2.2s ease-in-out infinite", textShadow: "0 0 20px rgba(255,204,0,0.9), 0 0 40px rgba(255,204,0,0.7)" }}>
                      {latestResult?.result ?? "—"}
                    </div>
                    <div className="mt-3 text-center text-sm text-neutral-300/70">
                      {latestResult?.formattedDate || (latestResult?.resultDate ? formatGameDate(latestResult.resultDate) : "")} • {latestResult?.time || latestResult?.resultTime || ""}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center">
              <div className="w-full max-w-md rounded-xl border border-yellow-500/20 bg-neutral-900/70 px-4 py-3 text-center shadow-lg">
                <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-yellow-300/75">
                  Next Upcoming Game
                </div>
                {loading ? (
                  <div className="mt-2 text-sm text-neutral-400">Loading upcoming game...</div>
                ) : nextUpcomingGame ? (
                  <>
                    <div className="mt-2 text-lg md:text-xl font-bold text-yellow-400">
                      {nextUpcomingGame.nickName}
                    </div>
                    <div className="mt-1 text-sm text-neutral-300/80">
                      Expected Time: {nextUpcomingGame.resultTime || "-"}
                    </div>
                  </>
                ) : (
                  <div className="mt-2 text-sm text-neutral-400">No upcoming games right now</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== MAIN CONTENT ====== */}
      <main className="container mx-auto px-4 pb-10 space-y-8">
        {/* ====== INFO / NOTICE PANEL (like image1 "INFO ONLY") ====== */}
        <section className="rounded-2xl border border-yellow-600/25 bg-neutral-950/60 overflow-hidden">
          <div className="bg-yellow-500/90 text-neutral-950 font-extrabold text-sm px-5 py-3 flex items-center justify-between">
            <span>INFO ONLY</span>
            <span className="text-[11px] bg-neutral-950/20 px-2 py-1 rounded">BOX</span>
          </div>

          <div className="p-5 md:p-7">
            <div className="rounded-xl border border-yellow-600/15 bg-neutral-900/50 p-5 text-sm text-neutral-200/80">
              <div className="font-bold text-yellow-300 mb-3">Market Time Table</div>

              <ul className="space-y-2 text-[13px]">
                <li className="flex items-center justify-between"><span>Delhi Bazar</span><span className="text-yellow-200/80">03:00 PM</span></li>
                <li className="flex items-center justify-between"><span>Shri Ganesh</span><span className="text-yellow-200/80">04:20 PM</span></li>
                <li className="flex items-center justify-between"><span>Faridabad</span><span className="text-yellow-200/80">05:50 PM</span></li>
                <li className="flex items-center justify-between"><span>Ghaziabad</span><span className="text-yellow-200/80">08:40 PM</span></li>
                <li className="flex items-center justify-between"><span>Gali</span><span className="text-yellow-200/80">11:10 PM</span></li>
                <li className="flex items-center justify-between"><span>Disawar</span><span className="text-yellow-200/80">02:00 AM</span></li>
              </ul>

              <div className="mt-5 flex items-center justify-center">
                <button className="inline-flex items-center gap-2 rounded-full bg-emerald-500/90 hover:bg-emerald-500 px-6 py-3 font-bold text-neutral-950 transition">
                  <Phone className="w-5 h-5" />
                  WhatsApp Now
                </button>
              </div>

              <div className="mt-4 text-center text-[11px] text-neutral-400">
                Note: Yeh information sirf general purpose ke liye.
              </div>
            </div>
          </div>
        </section>

        {/* ===== ALL GAMES GRID (no chart button) ===== */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-yellow-500/70 to-yellow-500/70 rounded" />
            <h2 className="text-xl md:text-2xl font-extrabold text-yellow-400">ALL GAMES</h2>
            <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-yellow-500/70 to-yellow-500/70 rounded" />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {(loading ? Array.from({ length: 8 }) : allGames).map((g: any, idx: number) => (
              <div
                key={g?._id || idx}
                className="rounded-xl border border-yellow-600/20 bg-neutral-950/50 hover:border-yellow-500/40 transition p-4"
              >
                {loading ? (
                  <SkeletonCompactCard />
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-white font-bold text-sm truncate uppercase">{g.nickName}</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        {g.resultTime ? `Time: ${g.resultTime}` : " "}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="bg-neutral-900 border border-yellow-600/30 rounded-lg px-3 py-1.5 min-w-[3.5rem] text-center">
                        <span className="text-yellow-400 font-black text-lg">
                          {g.hasResult ? g.result : "—"}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => setSelectedGameForChart(g.nickName)}
                        className={`p-2 rounded-full bg-neutral-900 border border-yellow-600/20 text-yellow-500 hover:bg-yellow-500 hover:text-neutral-950 transition ${
                          !g.hasResult ? "animate-pulse shadow-[0_0_14px_rgba(250,204,21,0.25)]" : ""
                        }`}
                      >
                        <BarChart3 className={`w-4 h-4 ${!g.hasResult ? "animate-bounce" : ""}`} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ===== UPCOMING & RESULTS SECTION ===== */}
        {/* <section className="grid lg:grid-cols-3 gap-6">
         
          <div className="lg:col-span-1 rounded-2xl border border-yellow-600/25 bg-neutral-950/60 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-yellow-400">UPCOMING</h3>
              <div className="h-1 w-12 bg-yellow-500/50 rounded-full" />
            </div>

            {loading ? (
              <div className="space-y-3">
                <SkeletonLine />
                <SkeletonLine />
                <SkeletonLine />
              </div>
            ) : upcomingGames.length === 0 ? (
              <div className="text-center text-gray-400 py-6 text-sm">No upcoming games</div>
            ) : (
              <div className="space-y-3">
                {upcomingGames.map((game: any, index: number) => (
                  <div
                    key={index}
                    className="rounded-xl border border-yellow-600/15 bg-neutral-950/40 p-4 hover:border-yellow-500/40 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-white font-bold text-sm">{game.nickName}</div>
                        <div className="text-[11px] text-neutral-400 mt-1">
                          {game.resultTime ? `Result Time: ${game.resultTime}` : " "}
                        </div>
                      </div>

                      {!game.hasResult && <RefreshCw className="w-4 h-4 animate-spin text-yellow-400/80" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 rounded-2xl p-6 border border-yellow-600/25 bg-gradient-to-br from-amber-950/35 via-neutral-950 to-neutral-900 shadow-xl">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-black text-yellow-400 mb-2">Today's Results Board</h2>
              <p className="text-yellow-200/80 text-sm mb-2">{todayGameDate}</p>
              <div className="inline-flex items-center gap-2 bg-red-600 text-white text-xs font-black px-4 py-1 rounded-full">
                ● PUBLISHED RESULTS ●
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonResultCard key={i} />)
              ) : todaysResults.length === 0 ? (
                <div className="col-span-full text-center text-gray-400 py-8">
                  <p className="text-lg">No results published for today yet</p>
                  <p className="text-sm mt-2">Check back later for today's game results</p>
                </div>
              ) : (
                todaysResults.map((game: any, index: number) => (
                  <div
                    key={index}
                    className="rounded-2xl p-4 border border-yellow-600/20 bg-neutral-950/40 hover:border-yellow-400/50 transition"
                  >
                    <h4 className="text-yellow-400 font-black text-center mb-1 text-sm">
                      {game.nickName}
                    </h4>

                    <p className="text-blue-400 text-xs text-center mb-2">
                      {game.resultTime ? `Result Time: ${game.resultTime}` : " "}
                    </p>

                    {game.hasResult && game.result ? (
                      <>
                        <p className="text-center text-gray-500 text-xs mb-3">
                          {game.resultDate ? `${formatGameDate(game.resultDate)} • ${game.resultTime || ""}` : "Today"}
                        </p>
                        <div className="text-center">
                          <div
                            className="rounded-xl py-3 px-6 mb-3 border border-yellow-500/25 bg-yellow-500/10"
                            style={{ animation: "softGlow 2.2s ease-in-out infinite" }}
                          >
                            <span className="text-yellow-300 font-black text-2xl">{game.result}</span>
                          </div>
                          <button
                            onClick={() => setSelectedGameForChart(game.nickName)}
                            className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-black py-2 hover:from-red-700 hover:to-red-800 transition"
                          >
                            View Chart
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <div className="rounded-xl py-3 px-6 mb-3 border border-neutral-700/40 bg-neutral-900/50">
                          <span className="text-neutral-200 font-bold text-sm">Loading / Pending</span>
                        </div>
                        <button
                          className="w-full rounded-xl bg-neutral-800 text-white font-bold py-2 cursor-not-allowed opacity-50"
                          disabled
                        >
                          View Chart
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section> */}
      </main>

      {/* Footer (keep yours) */}
      <footer className="bg-gradient-to-b from-transparent to-amber-950/30 py-8 mt-8 border-t border-yellow-600/20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-3">
            <p className="text-yellow-400 font-semibold">© 2024 555 Results Live Results. All Rights Reserved.</p>
            <p className="text-gray-500 text-sm">Play Responsibly | 18+ Only | Gambling Can Be Addictive</p>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
              <span>Terms & Conditions</span>
              <span>•</span>
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Responsible Gaming</span>
              <span>•</span>
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

// Helper skeleton components
function SkeletonLine() {
  return (
    <div className="rounded-xl border border-yellow-600/10 bg-neutral-950/40 p-4">
      <div className="h-3 w-2/3 bg-neutral-800/70 rounded mb-2 animate-pulse" />
      <div className="h-2 w-1/2 bg-neutral-800/50 rounded animate-pulse" />
    </div>
  );
}

function SkeletonResultCard() {
  return (
    <div className="rounded-2xl p-4 border border-yellow-600/15 bg-neutral-950/40">
      <div className="h-3 w-2/3 mx-auto bg-neutral-800/70 rounded mb-2 animate-pulse" />
      <div className="h-2 w-1/2 mx-auto bg-neutral-800/50 rounded mb-4 animate-pulse" />
      <div className="h-12 w-full bg-neutral-800/40 rounded-xl animate-pulse" />
      <div className="h-9 w-full bg-neutral-800/30 rounded-xl mt-3 animate-pulse" />
    </div>
  );
}

function SkeletonCompactCard() {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="h-3 w-3/4 bg-neutral-800/70 rounded mb-2 animate-pulse" />
        <div className="h-2 w-1/2 bg-neutral-800/50 rounded animate-pulse" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-10 w-14 bg-neutral-800/50 rounded-lg animate-pulse" />
        <div className="h-10 w-12 bg-neutral-800/40 rounded-full animate-pulse" />
      </div>
    </div>
  );
}

export default HomeDefault;
