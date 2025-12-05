import { Phone, MessageCircle, Trophy, Clock, TrendingUp, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import AdminDashboardV2 from './components/AdminDashboardV2';
import LatestUpdates from './components/LatestUpdates';
import CreateGame from './components/CreateGame';
import GameResult from './components/GameResult';
import GameChart from './components/GameChart';
import ProtectedRoute from './components/ProtectedRoute';

function HomePage() {
  const [primeGames, setPrimeGames] = useState<any[]>([]);
  const [localGames, setLocalGames] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGameForChart, setSelectedGameForChart] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [gamesResponse, resultsResponse, latestResultResponse] = await Promise.all([
          fetch('/api/games'),
          fetch('/api/results'),
          fetch('/api/games/latest-result')
        ]);

        if (!gamesResponse.ok || !resultsResponse.ok || !latestResultResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const gamesData = await gamesResponse.json();
        const resultsData = await resultsResponse.json();
        const latestResultData = await latestResultResponse.json();

        // Get today's date for filtering
        const today = new Date();
        const todayString = today.toDateString();

        // Process games to determine status based on current time
        const now = new Date();

        // Filter and process prime games for today only
        const allPrimeGames = (gamesData.prime || []).map((game: any) => {
          const startTime = new Date(game.startTime);
          const endTime = new Date(game.endTime);
          let status = 'upcoming';

          if (now >= startTime && now <= endTime) {
            status = 'live';
          } else if (now > endTime) {
            status = 'ended';
          }

          return { ...game, status };
        });

        // Filter and process local games for today only
        const allLocalGames = (gamesData.local || []).map((game: any) => {
          const startTime = new Date(game.startTime);
          const endTime = new Date(game.endTime);
          let status = 'upcoming';

          if (now >= startTime && now <= endTime) {
            status = 'live';
          } else if (now > endTime) {
            status = 'ended';
          }

          return { ...game, status };
        });

        // Filter games to only show today's games
        const todaysPrimeGames = allPrimeGames.filter((game: any) => {
          const gameDate = new Date(game.startTime).toDateString();
          return gameDate === todayString;
        });

        const todaysLocalGames = allLocalGames.filter((game: any) => {
          const gameDate = new Date(game.startTime).toDateString();
          return gameDate === todayString;
        });

        // Filter results to only show today's results
        const todaysResults = (resultsData || []).filter((result: any) => {
          const resultDate = new Date(result.createdAt).toDateString();
          return resultDate === todayString;
        });

        // Sort games by start time for finding last, current, next
        const sortedGames = todaysPrimeGames.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        setPrimeGames(sortedGames);
        setLocalGames(todaysLocalGames);
        setResults(todaysResults);

        // Set the latest result from the API
        setLatestResult(latestResultData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
            {/* Last Completed Game Today */}
            {(() => {
              const endedGames = primeGames.filter(game => game.status === 'ended');
              const lastCompletedGame = endedGames.length > 0 ? endedGames[endedGames.length - 1] : null;

              if (lastCompletedGame) {
                const gameResults = results.filter(r => r.name === lastCompletedGame.nickName);
                const lastResult = gameResults.length > 0 ? gameResults[0] : null;

                return (
                  <div
                    className="relative bg-gradient-to-br from-amber-950/50 via-neutral-900/80 to-amber-950/50 rounded-xl p-6 border-2 border-yellow-600/40 transition-all duration-300 hover:scale-105 hover:border-yellow-400 hover:shadow-2xl hover:shadow-yellow-600/20"
                  >
                    <div className="absolute -top-3 -right-3 bg-gray-600 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-white">
                      COMPLETED
                    </div>
                    <h3 className="text-yellow-400 font-bold text-xl text-center mb-2">{lastCompletedGame.nickName}</h3>
                    <p className="text-center text-gray-400 text-xs mb-4 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(lastCompletedGame.startTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })} - {new Date(lastCompletedGame.endTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                    <div className="bg-gradient-to-br from-amber-800 to-amber-950 rounded-full w-28 h-28 mx-auto flex items-center justify-center border-4 border-yellow-600/50 shadow-xl mb-4">
                      <span className="text-yellow-400 text-3xl font-bold">{lastResult ? lastResult.result : '?'}</span>
                    </div>
                    <button
                      onClick={() => setSelectedGameForChart(lastCompletedGame.nickName)}
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 hover:shadow-lg hover:shadow-red-600/50 transform hover:-translate-y-0.5"
                    >
                      View Chart
                    </button>
                  </div>
                );
              }
              return null;
            })()}

            {/* Current Live Game */}
            {(() => {
              const liveGame = primeGames.find(game => game.status === 'live');

              if (liveGame) {
                const now = new Date();
                const endTime = new Date(liveGame.endTime);
                const timeLeft = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / (1000 * 60))); // minutes left

                return (
                  <div
                    className="relative bg-gradient-to-br from-amber-950/50 via-neutral-900/80 to-amber-950/50 rounded-xl p-6 border-2 border-yellow-600/40 transition-all duration-300 hover:scale-105 hover:border-yellow-400 hover:shadow-2xl hover:shadow-yellow-600/20"
                  >
                    <div className="absolute -top-3 -right-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse border-2 border-white">
                      LIVE
                    </div>
                    <h3 className="text-yellow-400 font-bold text-xl text-center mb-2">{liveGame.nickName}</h3>
                    <p className="text-center text-gray-400 text-xs mb-2 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeLeft} min left
                    </p>
                    <p className="text-center text-gray-400 text-xs mb-4">
                      Ends: {new Date(liveGame.endTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                    <div className="bg-gradient-to-br from-amber-800 to-amber-950 rounded-full w-28 h-28 mx-auto flex items-center justify-center border-4 border-yellow-600/50 shadow-xl mb-4">
                      <span className="text-yellow-400 text-3xl font-bold">?</span>
                    </div>
                    <button
                      onClick={() => setSelectedGameForChart(liveGame.nickName)}
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 hover:shadow-lg hover:shadow-red-600/50 transform hover:-translate-y-0.5"
                    >
                      View Chart
                    </button>
                  </div>
                );
              }
              return null;
            })()}

            {/* Next Upcoming Game */}
            {(() => {
              const upcomingGames = primeGames.filter(game => game.status === 'upcoming');
              const nextUpcomingGame = upcomingGames.length > 0 ? upcomingGames[0] : null;

              if (nextUpcomingGame) {
                const now = new Date();
                const startTime = new Date(nextUpcomingGame.startTime);
                const timeUntilStart = Math.max(0, Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60))); // minutes until start

                return (
                  <div
                    className="relative bg-gradient-to-br from-amber-950/50 via-neutral-900/80 to-amber-950/50 rounded-xl p-6 border-2 border-yellow-600/40 transition-all duration-300 hover:scale-105 hover:border-yellow-400 hover:shadow-2xl hover:shadow-yellow-600/20"
                  >
                    <div className="absolute -top-3 -right-3 bg-yellow-600 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-white">
                      UPCOMING
                    </div>
                    <h3 className="text-yellow-400 font-bold text-xl text-center mb-2">{nextUpcomingGame.nickName}</h3>
                    <p className="text-center text-gray-400 text-xs mb-2 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      Starts in {timeUntilStart} min
                    </p>
                    <p className="text-center text-gray-400 text-xs mb-4">
                      {new Date(nextUpcomingGame.startTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                    <div className="bg-gradient-to-br from-amber-800 to-amber-950 rounded-full w-28 h-28 mx-auto flex items-center justify-center border-4 border-yellow-600/50 shadow-xl mb-4">
                      <span className="text-yellow-400 text-3xl font-bold">?</span>
                    </div>
                    <button
                      className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-bold py-3 rounded-lg hover:from-yellow-700 hover:to-yellow-800 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-600/50 transform hover:-translate-y-0.5"
                    >
                      Coming Soon
                    </button>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left Column - Booking Info */}
          <div className="lg:col-span-1 space-y-6">



            {/* Upcoming Games - Today's games that haven't started yet */}
            <div className="bg-gradient-to-br from-amber-950/70 via-neutral-900 to-amber-950/70 rounded-xl p-6 border-2 border-yellow-600/40 shadow-xl">
              <h3 className="text-yellow-400 text-lg font-bold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Today's Upcoming Games
              </h3>
              <div className="space-y-3">
                {localGames.filter((game: any) => game.status === 'upcoming').map((game: any, index: number) => (
                  <div key={index} className="bg-neutral-900/50 rounded-lg p-3 border border-yellow-600/20 hover:border-yellow-500/50 transition-colors">
                    <h4 className="text-white font-semibold text-sm">{game.nickName}</h4>
                    <p className="text-gray-400 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(game.startTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })} - {new Date(game.endTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                ))}
                {localGames.filter((game: any) => game.status === 'upcoming').length === 0 && (
                  <div className="text-center text-gray-400 py-4">
                    <p className="text-sm">No upcoming games for today</p>
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
                <div className="inline-block bg-red-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  ● PUBLISHED RESULTS ●
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...primeGames, ...localGames]
                  .filter(game => {
                    // Only show games that have results published today
                    const gameResults = results.filter(r => r.name === game.nickName);
                    return gameResults.length > 0;
                  })
                  .map((game, index) => {
                    // Find today's result for this game
                    const gameResults = results.filter(r => r.name === game.nickName);
                    const latestResult = gameResults.length > 0 ? gameResults[0] : null;

                    return (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-neutral-950/80 to-amber-950/40 rounded-lg p-4 border border-yellow-600/30 transition-all duration-300 hover:scale-105 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-600/10"
                      >
                        <h4 className="text-yellow-400 font-bold text-center mb-1 text-sm">
                          {game.nickName}
                        </h4>
                        {latestResult ? (
                          <>
                            <p className="text-center text-gray-500 text-xs mb-3">
                              {new Date(latestResult.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })} {latestResult.time}
                            </p>
                            <div className="text-center">
                              <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg py-3 px-6 mb-3 shadow-md">
                                <span className="text-white font-bold text-xl">{latestResult.result}</span>
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
                    );
                  })}
                {[...primeGames, ...localGames].filter(game => {
                  const gameResults = results.filter(r => r.name === game.nickName);
                  return gameResults.length > 0;
                }).length === 0 && (
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
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/dashboard-v2" element={<ProtectedRoute><AdminDashboardV2 /></ProtectedRoute>} />
        <Route path="/admin/create-game" element={<ProtectedRoute><CreateGame /></ProtectedRoute>} />
        <Route path="/admin/edit-game/:gameId" element={<ProtectedRoute><CreateGame /></ProtectedRoute>} />
        <Route path="/admin/game-result/:gameId" element={<ProtectedRoute><GameResult /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
