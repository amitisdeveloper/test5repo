import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Clock, Plus, Edit, Trash2, LogOut } from 'lucide-react';

interface Game {
  _id: string;
  nickName: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  gameType: string;
  status: string;
}

function AdminDashboard() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    fetchGames();
  }, [navigate]);

  const fetchGames = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/games/admin', {
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

  const handleDelete = async (gameId: string) => {
    if (!confirm('Are you sure you want to delete this game?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/games/${gameId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setGames(games.filter(game => game._id !== gameId));
      } else {
        setError('Failed to delete game');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center">
        <div className="text-yellow-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-900/20 to-transparent py-6 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <h1 className="text-2xl font-bold text-yellow-400">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/create-game')}
              className="bg-gradient-to-r from-yellow-600 to-amber-600 text-white px-4 py-2 rounded-lg hover:from-yellow-700 hover:to-amber-700 transition-all duration-300 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Game
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-300 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Games Management */}
          <div className="bg-gradient-to-br from-amber-950/70 via-neutral-900 to-amber-950/70 rounded-xl p-6 border-2 border-yellow-600/40 shadow-xl">
            <h2 className="text-xl font-bold text-yellow-400 mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Games Management
            </h2>

            {error && (
              <div className="text-red-400 text-sm mb-4 bg-red-900/20 border border-red-600/30 rounded-lg p-3">
                {error}
              </div>
            )}

            <div className="grid gap-4">
              {games.map((game) => (
                <div
                  key={game._id}
                  className="bg-neutral-900/50 rounded-lg p-4 border border-yellow-600/20 hover:border-yellow-500/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg">{game.nickName}</h3>
                      <p className="text-gray-400 text-sm">
                        {new Date(game.startTime).toLocaleString()} - {new Date(game.endTime).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          game.gameType === 'prime' ? 'bg-blue-600' : 'bg-green-600'
                        }`}>
                          {game.gameType.toUpperCase()}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          game.status === 'live' ? 'bg-red-600' :
                          game.status === 'coming soon' ? 'bg-yellow-600' : 'bg-gray-600'
                        }`}>
                          {game.status.toUpperCase()}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          game.isActive ? 'bg-green-600' : 'bg-red-600'
                        }`}>
                          {game.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/admin/game-result/${game._id}`)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Publish Result
                      </button>
                      <button
                        onClick={() => navigate(`/admin/edit-game/${game._id}`)}
                        className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(game._id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
