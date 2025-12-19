import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Archive, Calendar, Search, ArrowLeft } from 'lucide-react';
import { formatGameDate, formatGameTime } from '../utils/timezone';

interface ArchivedResult {
  _id: string;
  gameId: {
    _id: string;
    nickName: string;
    gameType: string;
  };
  publishedNumber: string;
  publishDate: string;
  createdAt: string;
}

function ArchivesPage() {
  const [results, setResults] = useState<ArchivedResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<ArchivedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [games, setGames] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const fetchArchives = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/game-results?limit=500');
        
        if (!response.ok) {
          throw new Error('Failed to fetch archives');
        }

        const data = await response.json();
        
        if (data.results && Array.isArray(data.results)) {
          const sortedResults = data.results.sort((a: ArchivedResult, b: ArchivedResult) => {
            return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
          });
          
          setResults(sortedResults);
          
          const uniqueGames = Array.from(
            new Map(
              sortedResults.map((r: ArchivedResult) => [r.gameId._id, r.gameId])
            ).values()
          );
          setGames(uniqueGames as any[]);
        }
      } catch (err) {
        console.error('Error fetching archives:', err);
        setError('Failed to load archived results. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchArchives();
  }, []);

  useEffect(() => {
    let filtered = results;

    if (selectedDate) {
      const selectedDateStr = new Date(selectedDate).toDateString();
      filtered = filtered.filter(r => {
        const resultDate = new Date(r.publishDate).toDateString();
        return resultDate === selectedDateStr;
      });
    }

    if (selectedGame !== 'all') {
      filtered = filtered.filter(r => r.gameId._id === selectedGame);
    }

    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.gameId.nickName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.publishedNumber.includes(searchTerm)
      );
    }

    setFilteredResults(filtered);
  }, [selectedDate, selectedGame, searchTerm, results]);

  const groupedResults = filteredResults.reduce((acc: Record<string, ArchivedResult[]>, result) => {
    const dateKey = new Date(result.publishDate).toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(result);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedResults).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading archives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      {/* Header */}
      <header className="relative py-8 px-4 border-b border-yellow-600/30">
        <div className="container mx-auto relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Archive className="w-8 h-8 text-yellow-400" />
              <h1 className="text-4xl font-bold text-yellow-400">Results Archives</h1>
            </div>
            <Link 
              to="/" 
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/40 rounded-lg border border-yellow-600/40 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
          <p className="text-gray-400">View historical game results from previous dates</p>
        </div>
      </header>

      {/* Filters */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-amber-950/70 via-neutral-900 to-amber-950/70 rounded-xl p-6 border-2 border-yellow-600/40 shadow-xl mb-8">
          <h2 className="text-xl font-bold text-yellow-400 mb-6">Filter Archives</h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-yellow-300 mb-2">
                Search Game or Result
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by game name or number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-900/50 border border-yellow-600/20 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-semibold text-yellow-300 mb-2">
                Select Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-900/50 border border-yellow-600/20 rounded-lg text-white focus:border-yellow-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Game Filter */}
            <div>
              <label className="block text-sm font-semibold text-yellow-300 mb-2">
                Select Game
              </label>
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="w-full px-4 py-2 bg-neutral-900/50 border border-yellow-600/20 rounded-lg text-white focus:border-yellow-500 focus:outline-none transition-colors"
              >
                <option value="all">All Games</option>
                {games.map(game => (
                  <option key={game._id} value={game._id}>
                    {game.nickName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || selectedDate || selectedGame !== 'all') && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDate('');
                  setSelectedGame('all');
                }}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-600/40 text-red-300 rounded-lg transition-colors text-sm font-semibold"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Results Display */}
        <div className="space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-600/40 rounded-lg p-4 text-red-300">
              {error}
            </div>
          )}

          {filteredResults.length === 0 ? (
            <div className="bg-gradient-to-br from-amber-950/70 via-neutral-900 to-amber-950/70 rounded-xl p-8 border-2 border-yellow-600/40 text-center">
              <Archive className="w-12 h-12 text-yellow-600/50 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No archived results found</p>
              <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            sortedDates.map(dateKey => (
              <div key={dateKey}>
                <h3 className="text-lg font-bold text-yellow-400 mb-4">
                  {formatGameDate(new Date(dateKey))}
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedResults[dateKey].map(result => (
                    <div
                      key={result._id}
                      className="bg-gradient-to-br from-neutral-950/80 to-amber-950/40 rounded-lg p-4 border border-yellow-600/30 transition-all duration-300 hover:scale-105 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-600/10"
                    >
                      <h4 className="text-yellow-400 font-bold text-center mb-3 text-sm">
                        {result.gameId.nickName}
                      </h4>
                      <div className="text-center">
                        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg py-4 px-6 mb-3 shadow-md">
                          <span className="text-white font-bold text-2xl">{result.publishedNumber}</span>
                        </div>
                        <p className="text-gray-500 text-xs">
                          {formatGameTime(new Date(result.publishDate))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-transparent to-amber-950/30 py-8 mt-12 border-t border-yellow-600/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-3">
            <p className="text-yellow-400 font-semibold">© 2024 555 Results Live Results. All Rights Reserved.</p>
            <p className="text-gray-500 text-sm">Play Responsibly | 18+ Only | Gambling Can Be Addictive</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ArchivesPage;
