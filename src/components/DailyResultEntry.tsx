import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatGameDate, formatGameTime } from '../utils/timezone';

interface Game {
  _id: string;
  name: string;
  nickName: string;
}

interface DailyResult {
  _id: string;
  gameId: Game;
  resultNumber: string;
  resultDate: string;
  createdAt: string;
}

function DailyResultEntry() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [resultNumber, setResultNumber] = useState('');
  const [allResults, setAllResults] = useState<DailyResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNumber, setEditingNumber] = useState('');
  const [todayDateIST_YYYYMMDD, setTodayDateIST_YYYYMMDD] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchGames();
    fetchResults();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/games', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/admin/login');
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch games');

      const data = await response.json();
      const gamesArray = data.localUpcoming && data.localWithResults ? [...data.localUpcoming, ...data.localWithResults] : (Array.isArray(data) ? data : []);
      setGames(gamesArray);
      setTodayDateIST_YYYYMMDD(data.todayDateIST_YYYYMMDD || '');
    } catch (err) {
      console.error('Error fetching games:', err);
      setError('Failed to load games');
    }
  };

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/daily-results', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch results');

      const data = await response.json();
      setAllResults(data);
    } catch (err) {
      console.error('Error fetching results:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddResult = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedGameId || !resultNumber.trim()) {
      setError('Please select a game and enter a result number');
      return;
    }

    try {
      setError('');
      const response = await fetch('/api/admin/daily-results', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: selectedGameId,
          resultNumber: resultNumber.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add result');
      }

      setSuccess('Result added successfully!');
      setResultNumber('');
      setTimeout(() => setSuccess(''), 3000);
      fetchResults();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add result');
    }
  };

  const handleUpdateResult = async (id: string) => {
    if (!editingNumber.trim()) {
      setError('Please enter a result number');
      return;
    }

    try {
      setError('');
      const response = await fetch(`/api/admin/daily-results/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resultNumber: editingNumber.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update result');
      }

      setSuccess('Result updated successfully!');
      setEditingId(null);
      setTimeout(() => setSuccess(''), 3000);
      fetchResults();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update result');
    }
  };

  const handleDeleteResult = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this result?')) return;

    try {
      setError('');
      const response = await fetch(`/api/admin/daily-results/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete result');
      }

      setSuccess('Result deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchResults();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete result');
    }
  };

  const isToday = (dateString: string) => {
    if (!todayDateIST_YYYYMMDD) return false;
    const resultDateIST = dateString ? dateString.split('T')[0] : '';
    return resultDateIST === todayDateIST_YYYYMMDD;
  };

  const todayResults = allResults.filter(r => isToday(r.resultDate));
  const previousResults = allResults.filter(r => !isToday(r.resultDate));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center">
        <div className="text-yellow-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      <header className="bg-gradient-to-r from-amber-950/80 to-neutral-900 border-b border-yellow-600/30 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-yellow-400">Daily Result Entry</h1>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="container mx-auto p-6">
        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 border border-red-600/30 rounded-lg p-3 mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-400 text-sm bg-green-900/20 border border-green-600/30 rounded-lg p-3 mb-6">
            {success}
          </div>
        )}

        <div className="bg-gradient-to-br from-amber-950/70 via-neutral-900 to-amber-950/70 rounded-lg p-6 border-2 border-yellow-600/40 mb-8">
          <h2 className="text-lg font-semibold text-yellow-400 mb-4">Enter Today's Result</h2>
          
          <form onSubmit={handleAddResult} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-yellow-400 mb-2">Select Game</label>
                <select
                  value={selectedGameId}
                  onChange={(e) => setSelectedGameId(e.target.value)}
                  className="w-full px-4 py-2 bg-neutral-800 border border-yellow-600/30 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                >
                  <option value="">-- Select a Game --</option>
                  {games.map(game => (
                    <option key={game._id} value={game._id}>
                      {game.name} ({game.nickName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-yellow-400 mb-2">Result Number</label>
                <input
                  type="text"
                  value={resultNumber}
                  onChange={(e) => setResultNumber(e.target.value)}
                  placeholder="Enter result number"
                  className="w-full px-4 py-2 bg-neutral-800 border border-yellow-600/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold"
                >
                  Add Result
                </button>
              </div>
            </div>
          </form>
        </div>

        {todayResults.length > 0 && (
          <div className="bg-gradient-to-br from-amber-950/70 via-neutral-900 to-amber-950/70 rounded-lg p-6 border-2 border-yellow-600/40 mb-8">
            <h2 className="text-lg font-semibold text-yellow-400 mb-4">Today's Results</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-300">
                <thead>
                  <tr className="border-b border-yellow-600/30">
                    <th className="text-left py-3 px-4 text-yellow-400">Game Name</th>
                    <th className="text-left py-3 px-4 text-yellow-400">Result Number</th>
                    <th className="text-left py-3 px-4 text-yellow-400">Time</th>
                    <th className="text-left py-3 px-4 text-yellow-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {todayResults.map(result => (
                    <tr key={result._id} className="border-b border-yellow-600/20 hover:bg-amber-950/20">
                      <td className="py-4 px-4 font-semibold text-white">{result.gameId.name}</td>
                      <td className="py-4 px-4">
                        {editingId === result._id ? (
                          <input
                            type="text"
                            value={editingNumber}
                            onChange={(e) => setEditingNumber(e.target.value)}
                            className="px-3 py-1 bg-neutral-800 border border-yellow-600/30 rounded text-white focus:outline-none focus:border-yellow-400"
                            autoFocus
                          />
                        ) : (
                          <span className="bg-green-900/50 text-green-400 px-3 py-1 rounded text-sm border border-green-600/30">
                            {result.resultNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-400 text-sm">
                        {formatGameTime(new Date(result.createdAt))}
                      </td>
                      <td className="py-4 px-4 flex gap-2">
                        {editingId === result._id ? (
                          <>
                            <button
                              onClick={() => handleUpdateResult(result._id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition-all"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs transition-all"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(result._id);
                                setEditingNumber(result.resultNumber);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteResult(result._id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-all"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {previousResults.length > 0 && (
          <div className="bg-gradient-to-br from-amber-950/70 via-neutral-900 to-amber-950/70 rounded-lg p-6 border-2 border-yellow-600/40">
            <h2 className="text-lg font-semibold text-yellow-400 mb-4">Previous Results</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-300">
                <thead>
                  <tr className="border-b border-yellow-600/30">
                    <th className="text-left py-3 px-4 text-yellow-400">Game Name</th>
                    <th className="text-left py-3 px-4 text-yellow-400">Result Number</th>
                    <th className="text-left py-3 px-4 text-yellow-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {previousResults.map(result => (
                    <tr key={result._id} className="border-b border-yellow-600/20 hover:bg-amber-950/20">
                      <td className="py-4 px-4 font-semibold text-white">{result.gameId.name}</td>
                      <td className="py-4 px-4">
                        <span className="bg-blue-900/50 text-blue-400 px-3 py-1 rounded text-sm border border-blue-600/30">
                          {result.resultNumber}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-400 text-sm">
                        {formatGameDate(result.resultDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {allResults.length === 0 && !loading && (
          <div className="text-center text-gray-400">
            <p>No results entered yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default DailyResultEntry;
