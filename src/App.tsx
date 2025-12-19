import { Phone, MessageCircle, Trophy, Clock, TrendingUp, Settings, RefreshCw } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import AdminDashboardV2 from './components/AdminDashboardV2';
import LatestUpdates from './components/LatestUpdates';
import CreateGame from './components/CreateGame';
import GameResult from './components/GameResult';
import GameChart from './components/GameChart';
import GameResultsPage from './components/GameResultsPage';
import ProtectedRoute from './components/ProtectedRoute';
import ArchivesPage from './components/ArchivesPage';
import DailyResultEntry from './components/DailyResultEntry';
import { formatGameDate } from './utils/timezone';

function HomePage() {
  const [upcomingGames, setUpcomingGames] = useState<any[]>([]);
  const [todaysResults, setTodaysResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGameForChart, setSelectedGameForChart] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<any>(null);
  const [todayGameDate, setTodayGameDate] = useState<string>('');
  const [todayDateIST_YYYYMMDD, setTodayDateIST_YYYYMMDD] = useState<string>('');
  const isFirstLoad = useRef(true);

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

        // 🔍 API TIMEZONE DEBUGGING - Show backend timezone info
        console.log('🕒 === BACKEND TIMEZONE INFO ===');
        console.log('todayGameDate from API:', gamesData.todayGameDate);
        console.log('todayDateIST from API:', gamesData.todayDateIST);
        console.log('todayDateIST_YYYYMMDD from API:', gamesData.todayDateIST_YYYYMMDD);
        console.log('filteringRange from API:', gamesData.filteringRange);
        console.log('localWithResults count:', gamesData.localWithResults?.length || 0);
        console.log('todaysResults count:', gamesData.todaysResults?.length || 0);
        console.log('🕒 =========================');

        // Combine local games with their result status
        const allLocalGames = gamesData.localUpcoming || [];
        const localWithResults = gamesData.localWithResults || [];
        const allGames = [...allLocalGames, ...localWithResults];

        // Separate by result status
        const upcomingOnly = allGames.filter((g: any) => !g.hasResult);
        const withResults = allGames.filter((g: any) => g.hasResult);

        setUpcomingGames(upcomingOnly);
        setTodaysResults(withResults);
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

    return () => {
      if (eventSource) {
        console.log('[SSE] Closing connection');
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      {/* Header */}
      <header className="relative py-8 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 to-transparent"></div>
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-500 via-amber-600 to-yellow-700 rounded-full mb-4 shadow-xl border-4 border-yellow-400/30">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 mb-3" style={{ animation: 'glow 2s ease-in-out infinite' }}>
              555 RESULTS
            </h1>
            <div className="flex items-center justify-center gap-2 text-amber-400">
              <TrendingUp className="w-4 h-4" />
              <p className="text-sm font-semibold">Live Results & Fast Updates</p>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      {/* Latest Updates Section */}
      <div className="mt-8">
        <LatestUpdates
          latestResult={latestResult}
          isLoading={loading}
        />
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-8">

        {/* Featured Games Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-yellow-500 to-yellow-500 rounded"></div>
            <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Featured Games
            </h2>
            <div className="h-1 flex-1 bg-gradient-to-l from-transparent via-yellow-500 to-yellow-500 rounded"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left Column - Booking Info */}
          <div className="lg:col-span-1 space-y-6">

            {/* Upcoming Games */}
            <div className="bg-gradient-to-br from-amber-950/70 via-neutral-900 to-amber-950/70 rounded-xl p-6 border-2 border-yellow-600/40 shadow-xl">
              <h3 className="text-yellow-400 text-lg font-bold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Upcoming Games
              </h3>
              <div className="space-y-3">
                {upcomingGames.map((game: any, index: number) => (
                  <div key={index} className="bg-neutral-900/50 rounded-lg p-3 border border-yellow-600/20 hover:border-yellow-500/50 transition-colors">
                    <h4 className="text-white font-semibold text-sm">{game.nickName}</h4>
                  </div>
                ))}
                {upcomingGames.length === 0 && (
                  <div className="text-center text-gray-400 py-4">
                    <p className="text-sm">No upcoming games</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Today's Results */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-amber-950/70 via-neutral-900 to-amber-950/70 rounded-xl p-6 border-2 border-yellow-600/40 shadow-xl">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-yellow-400 mb-2">Today's Results Board</h2>
                <p className="text-yellow-200 text-sm mb-2">{todayGameDate}</p>
                <div className="inline-block bg-red-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  ● PUBLISHED RESULTS ●
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {todaysResults.map((game: any, index: number) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-neutral-950/80 to-amber-950/40 rounded-lg p-4 border border-yellow-600/30 transition-all duration-300 hover:scale-105 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-600/10"
                  >
                    <h4 className="text-yellow-400 font-bold text-center mb-1 text-sm">
                      {game.nickName}
                    </h4>
                    {game.hasResult && game.result ? (
                      <>
                        <p className="text-center text-gray-500 text-xs mb-3">
                          {game.resultDate ? formatGameDate(game.resultDate) : 'Today'}
                        </p>
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
                        <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg py-3 px-6 mb-3 shadow-md">
                          <span className="text-white font-bold text-sm">No Result</span>
                        </div>
                        <button
                          className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold py-2 rounded-lg cursor-not-allowed opacity-50"
                          disabled
                        >
                          View Chart
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {todaysResults.length === 0 && (
                  <div className="col-span-full text-center text-gray-400 py-8">
                    <p className="text-lg">No results published for today yet</p>
                    <p className="text-sm mt-2">Check back later for today's game results</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>



      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-transparent to-amber-950/30 py-8 mt-12 border-t border-yellow-600/30">
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

      {/* Game Chart Modal */}
      {selectedGameForChart && (
        <GameChart
          gameName={selectedGameForChart}
          onClose={() => setSelectedGameForChart(null)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/archives" element={<ArchivesPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/dashboard-v2" element={<ProtectedRoute><AdminDashboardV2 /></ProtectedRoute>} />
        <Route path="/admin/daily-results" element={<ProtectedRoute><DailyResultEntry /></ProtectedRoute>} />
        <Route path="/admin/create-game" element={<ProtectedRoute><CreateGame /></ProtectedRoute>} />
        <Route path="/admin/edit-game/:gameId" element={<ProtectedRoute><CreateGame /></ProtectedRoute>} />
        <Route path="/admin/game-result/:gameId" element={<ProtectedRoute><GameResult /></ProtectedRoute>} />
        <Route path="/admin/game-results" element={<ProtectedRoute><GameResultsPage /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
