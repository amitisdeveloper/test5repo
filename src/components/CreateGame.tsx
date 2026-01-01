import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TimePicker from './TimePicker';

function CreateGame() {
  const { gameId } = useParams<{ gameId: string }>();
  const isEditing = !!gameId;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nickName: '',
    isActive: true,
    resultTime: '',
    resultDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      fetchGame();
    }
  }, [gameId, isEditing]);

  const fetchGame = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/games/${gameId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/admin/login');
        return;
      }

      const game = await response.json();

      if (game) {
        setFormData({
          nickName: game.nickName,
          isActive: game.isActive,
          resultTime: game.resultTime || '',
          resultDate: game.resultDate ? new Date(game.resultDate).toISOString().split('T')[0] : ''
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
      const url = isEditing ? `/api/games/${gameId}` : '/api/games';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/admin/dashboard');
      } else {
        setError(data.error || 'Failed to save game');
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
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="bg-gradient-to-br from-amber-950/70 via-neutral-900 to-amber-950/70 rounded-xl p-8 border-2 border-yellow-600/40 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-yellow-400">
              {isEditing ? 'Edit Game' : 'Create New Game'}
            </h1>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-yellow-400 hover:text-yellow-300 text-sm underline"
            >
              Back to Dashboard
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="nickName" className="block text-sm font-medium text-yellow-400 mb-2">
                Game Name
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
              <label htmlFor="resultTime" className="block text-sm font-medium text-yellow-400 mb-2">
                Result Time
              </label>
              <TimePicker
                value={formData.resultTime}
                onChange={(time) => setFormData({ ...formData, resultTime: time })}
                placeholder="Select Result Time"
              />
              <p className="text-gray-400 text-sm mt-1">
                Choose the time when this game's result will be announced
              </p>
            </div>

            <div>
              <label htmlFor="resultDate" className="block text-sm font-medium text-yellow-400 mb-2">
                Result Date
              </label>
              <input
                type="date"
                id="resultDate"
                name="resultDate"
                value={formData.resultDate}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-neutral-800 border border-yellow-600/30 rounded-lg text-white focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
              />
              <p className="text-gray-400 text-sm mt-1">
                Choose the date when this game's result will be announced (leave empty for same day)
              </p>
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
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Game' : 'Create Game')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateGame;
