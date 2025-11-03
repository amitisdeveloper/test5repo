import { Phone, MessageCircle, Trophy, Clock, TrendingUp, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import CreateGame from './components/CreateGame';
import GameResult from './components/GameResult';
import GameChart from './components/GameChart';

function HomePage() {
  const [primeGames, setPrimeGames] = useState<any[]>([]);
  const [localGames, setLocalGames] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGameForChart, setSelectedGameForChart] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [gamesResponse, resultsResponse] = await Promise.all([
          fetch('/api/games'),
          fetch('/api/results')
        ]);

        if (!gamesResponse.ok || !resultsResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const gamesData = await gamesResponse.json();
        const resultsData = await resultsResponse.json();

        // Process games to determine status based on current time
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const processedPrimeGames = (gamesData.prime || [])
          .filter((game: any) => {
            const gameDate = new Date(game.startTime);
            return gameDate.toDateString() === today.toDateString();
          })
          .map((game: any) => {
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

        const processedLocalGames = (gamesData.local || []).map((game: any) => {
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

        setPrimeGames(processedPrimeGames);
        setLocalGames(processedLocalGames);
        setResults(resultsData || []);
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
      {/* News Ticker */}
      <div className="bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 py-3 overflow-hidden border-y-2 border-yellow-400/50">
        <div className="marquee whitespace-nowrap text-neutral-900 font-bold text-sm">
          ⭐ Welcome to 555 Results Live Results ⭐ Get Latest Updates Here ⭐ 24/7 Support Available ⭐ 100% Accurate Results ⭐ Fast & Secure ⭐ Call Now for Booking ⭐
        </div>
      </div>

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
            {primeGames.map((game: any, index: number) => (
              <div
                key={index}
                className="relative bg-gradient-to-br from-amber-950/50 via-neutral-900/80 to-amber-950/50 rounded-xl p-6 border-2 border-yellow-600/40 transition-all duration-300 hover:scale-105 hover:border-yellow-400 hover:shadow-2xl hover:shadow-yellow-600/20"
              >
                {game.status === 'live' && (
                  <div className="absolute -top-3 -right-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse border-2 border-white">
                    LIVE
                  </div>
                )}
                {game.status === 'coming soon' && (
                  <div className="absolute -top-3 -right-3 bg-yellow-600 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-white">
                    SOON
                  </div>
                )}
                {game.status === 'ended' && (
                  <div className="absolute -top-3 -right-3 bg-gray-600 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-white">
                    ENDED
                  </div>
                )}
                <h3 className="text-yellow-400 font-bold text-xl text-center mb-2">{game.nickName}</h3>
                <p className="text-center text-gray-400 text-xs mb-4 flex items-center justify-center gap-1">
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
                <div className="bg-gradient-to-br from-amber-800 to-amber-950 rounded-full w-28 h-28 mx-auto flex items-center justify-center border-4 border-yellow-600/50 shadow-xl mb-4">
                  <span className="text-yellow-400 text-3xl font-bold">?</span>
                </div>
                <button
                  onClick={() => setSelectedGameForChart(game.nickName)}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 hover:shadow-lg hover:shadow-red-600/50 transform hover:-translate-y-0.5"
                >
                  View Chart
                </button>
              </div>
            ))}
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
                {localGames.map((game: any, index: number) => (
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
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-amber-950/70 via-neutral-900 to-amber-950/70 rounded-xl p-6 border-2 border-yellow-600/40 shadow-xl">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-yellow-400 mb-2">Live Results Board</h2>
                <div className="inline-block bg-red-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  ● UPDATED LIVE ●
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...primeGames, ...localGames].map((game, index) => {
                  // Find today's result for this game
                  const today = new Date().toDateString();
                  const gameResults = results.filter(r => r.name === game.nickName && new Date(r.createdAt).toDateString() === today);
                  const todayResult = gameResults.length > 0 ? gameResults[0] : null;

                  return (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-neutral-950/80 to-amber-950/40 rounded-lg p-4 border border-yellow-600/30 transition-all duration-300 hover:scale-105 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-600/10"
                    >
                      <h4 className="text-yellow-400 font-bold text-center mb-1 text-sm">
                        {game.nickName}
                      </h4>
                      {todayResult ? (
                        <>
                          <p className="text-center text-gray-500 text-xs mb-3">
                            {new Date(todayResult.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })} {todayResult.time}
                          </p>
                          <div className="text-center">
                            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg py-3 px-6 mb-3 shadow-md">
                              <span className="text-white font-bold text-xl">{todayResult.result}</span>
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
                          <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-lg py-3 px-6 mb-3 shadow-md">
                            <span className="text-white font-bold text-sm">Coming Soon</span>
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
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/create-game" element={<CreateGame />} />
        <Route path="/admin/edit-game/:gameId" element={<CreateGame />} />
        <Route path="/admin/game-result/:gameId" element={<GameResult />} />
      </Routes>
    </Router>
  );
}

export default App;
