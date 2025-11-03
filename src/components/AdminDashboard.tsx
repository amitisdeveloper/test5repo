import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Game {
  _id: string;
  nickName: string;
  startTime: string;
  endTime: string;
  gameType: string;
  isActive: boolean;
  latestResult?: {
    result: string;
    date: string;
    time: string;
  } | null;
}

function AdminDashboard() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditTable, setShowEditTable] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/games/admin', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/admin/login');
        return;
      }

      const data = await response.json();
      setGames(data);
    } catch (err) {
      setError('Failed to fetch games');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  const handlePublishResult = (gameId: string) => {
    navigate(`/admin/game-result/${gameId}`);
  };

  const handleCreateGame = () => {
    navigate('/admin/create-game');
  };

  const handleEditGame = (gameId: string) => {
    navigate(`/admin/edit-game/${gameId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center">
        <div className="text-yellow-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-950/80 to-neutral-900 border-b border-yellow-600/30 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-yellow-400">Admin Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowEditTable(!showEditTable)}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-300"
            >
              {showEditTable ? 'Hide Edit Table' : 'Show Edit Table'}
            </button>
            <button
              onClick={handleCreateGame}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300"
            >
              Create Game
            </button>
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        <h2 className="text-xl font-semibold text-yellow-400 mb-6">Games Management</h2>

        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 border border-red-600/30 rounded-lg p-3 mb-6">
            {error}
          </div>
        )}

        {/* Game Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {games.map(game => (
            <div key={game._id} className="bg-gradient-to-br from-amber-950/70 via-neutral-900 to-amber-950/70 rounded-lg p-6 border-2 border-yellow-600/40">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-yellow-400">{game.nickName}</h3>
                  <p className="text-gray-400 text-sm">{game.gameType.toUpperCase()}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  game.isActive
                    ? 'bg-green-900/50 text-green-400 border border-green-600/30'
                    : 'bg-red-900/50 text-red-400 border border-red-600/30'
                }`}>
                  {game.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="text-sm text-gray-300 mb-4">
                <p>Start: {new Date(game.startTime).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}</p>
                <p>End: {new Date(game.endTime).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}</p>
                {game.latestResult && (
                  <div className="mt-2 p-2 bg-green-900/20 border border-green-600/30 rounded">
                    <p className="text-green-400 font-semibold">Latest Result: {game.latestResult.result}</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(game.latestResult.date).toLocaleDateString()} {game.latestResult.time}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handlePublishResult(game._id)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 text-sm"
                >
                  Publish Result
                </button>
                <button
                  onClick={() => handleEditGame(game._id)}
                  className="flex-1 bg-gradient-to-r from-yellow-600 to-amber-600 text-white px-3 py-2 rounded-lg hover:from-yellow-700 hover:to-amber-700 transition-all duration-300 text-sm"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Table */}
        {showEditTable && (
          <div className="bg-gradient-to-br from-amber-950/70 via-neutral-900 to-amber-950/70 rounded-lg p-6 border-2 border-yellow-600/40">
            <h3 className="text-lg font-bold text-yellow-400 mb-4">Edit Games Table</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-300">
                <thead>
                  <tr className="border-b border-yellow-600/30">
                    <th className="text-left py-2 px-4 text-yellow-400">Game Name</th>
                    <th className="text-left py-2 px-4 text-yellow-400">Type</th>
                    <th className="text-left py-2 px-4 text-yellow-400">Start Time</th>
                    <th className="text-left py-2 px-4 text-yellow-400">End Time</th>
                    <th className="text-left py-2 px-4 text-yellow-400">Latest Result</th>
                    <th className="text-left py-2 px-4 text-yellow-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map(game => (
                    <tr key={game._id} className="border-b border-yellow-600/20 hover:bg-amber-950/20">
                      <td className="py-3 px-4 font-semibold text-white">{game.nickName}</td>
                      <td className="py-3 px-4 text-gray-400">{game.gameType.toUpperCase()}</td>
                      <td className="py-3 px-4 text-gray-400">
                        {new Date(game.startTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {new Date(game.endTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </td>
                      <td className="py-3 px-4">
                        {game.latestResult ? (
                          <div>
                            <span className="text-green-400 font-bold">{game.latestResult.result}</span>
                            <br />
                            <span className="text-gray-500 text-xs">
                              {new Date(game.latestResult.date).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500">No result</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleEditGame(game._id)}
                          className="bg-gradient-to-r from-yellow-600 to-amber-600 text-white px-3 py-1 rounded text-xs hover:from-yellow-700 hover:to-amber-700 transition-all duration-300"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {games.length === 0 && (
          <div className="text-center text-gray-400 mt-12">
            <p>No games found. Create your first game!</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
