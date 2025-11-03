import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function CreateGame() {
  const { gameId } = useParams<{ gameId: string }>();
  const isEditing = !!gameId;
  const [formData, setFormData] = useState({
    nickName: '',
    date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
    startTime: '',
    endTime: '',
    gameType: 'prime',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isEditing && gameId) {
      fetchGame();
    }
  }, [gameId, isEditing]);

  const fetchGame = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/games/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/admin/login');
        return;
      }

      const games = await response.json();
      const game = games.find((g: any) => g._id === gameId);

      if (game) {
        const gameDate = new Date(game.startTime).toISOString().split('T')[0];
        const startTime = new Date(game.startTime).toTimeString().slice(0, 5);
        const endTime = new Date(game.endTime).toTimeString().slice(0, 5);
        setFormData({
          nickName: game.nickName,
          date: gameDate,
          startTime: startTime,
          endTime: endTime,
          gameType: game.gameType,
          isActive: game.isActive,
        });
      }
    } catch (err) {
      setError('Failed to fetch game details');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const url = isEditing ? `http://localhost:5000/api/games/${gameId}` : 'http://localhost:5000/api/games';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          startTime: new Date(`${formData.date}T${formData.startTime}`),
          endTime: new Date(`${formData.date}T${formData.endTime}`),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/admin/dashboard');
      } else {
        setError(data.error || `Failed to ${isEditing ? 'update' : 'create'} game`);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="bg-gradient-to-br from-amber-950/70 via-neutral-900 to-amber-950/70 rounded-xl p-8 border-2 border-yellow-600/40 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-yellow-400">
              {isEditing ? 'Edit Game' : 'Create New Game'}
            </h1>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-yellow-400 hover:text-yellow-300 underline"
            >
              Back to Dashboard
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="nickName" className="block text-sm font-medium text-yellow-400 mb-2">
                Game Name *
              </label>
              <input
                type="text"
                id="nickName"
                name="nickName"
                value={formData.nickName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-neutral-800 border border-yellow-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                placeholder="Enter game name"
                required
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-yellow-400 mb-2">
                Date *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-neutral-800 border border-yellow-600/30 rounded-lg text-white focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-yellow-400 mb-2">
                  Start Time *
                </label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-neutral-800 border border-yellow-600/30 rounded-lg text-white focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                  required
                />
              </div>

              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-yellow-400 mb-2">
                  End Time *
                </label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-neutral-800 border border-yellow-600/30 rounded-lg text-white focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="gameType" className="block text-sm font-medium text-yellow-400 mb-2">
                Game Type *
              </label>
              <select
                id="gameType"
                name="gameType"
                value={formData.gameType}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-neutral-800 border border-yellow-600/30 rounded-lg text-white focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
              >
                <option value="prime">Prime</option>
                <option value="local">Local</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-300">
                Active Game
              </label>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 border border-red-600/30 rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 text-white font-bold py-3 rounded-lg hover:from-yellow-700 hover:to-amber-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? `${isEditing ? 'Updating' : 'Creating'} Game...` : `${isEditing ? 'Update' : 'Create'} Game`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateGame;
