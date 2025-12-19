import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { formatGameDate } from '../utils/timezone';

interface Game {
  _id: string;
  name: string;
  nickName?: string;
  gameType: string;
  isActive: boolean;
}

interface PublishResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    gameId: string;
    publishDate: string;
    publishedNumber: string;
  }) => Promise<void>;
  loading?: boolean;
  error?: string;
}

function PublishResultModal({ isOpen, onClose, onSubmit, loading, error }: PublishResultModalProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    gameId: '',
    publishDate: '',
    publishedNumber: ''
  });

  const API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        publishDate: today
      }));
      fetchGames();
    }
    setFormError('');
  }, [isOpen]);

  const fetchGames = async () => {
    try {
      setLoadingGames(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/games/admin/active-games`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }

      const data = await response.json();
      setGames(data);
    } catch (err) {
      console.error('Error fetching games:', err);
      setFormError('Failed to load games');
    } finally {
      setLoadingGames(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.gameId || !formData.publishDate || !formData.publishedNumber) {
      setFormError('All fields are required');
      return;
    }

    try {
      await onSubmit({
        gameId: formData.gameId,
        publishDate: formData.publishDate,
        publishedNumber: formData.publishedNumber
      });

      const today = new Date().toISOString().split('T')[0];
      setFormData({
        gameId: '',
        publishDate: today,
        publishedNumber: ''
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to publish result');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Publish Game Result</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(formError || error) && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {formError || error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Game
            </label>
            <select
              name="gameId"
              value={formData.gameId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={loading || loadingGames}
            >
              <option value="">-- Choose a game --</option>
              {games.map(game => (
                <option key={game._id} value={game._id}>
                  {game.name || game.nickName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Publish Date
            </label>
            <input
              type="date"
              name="publishDate"
              value={formData.publishDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Published Number
            </label>
            <input
              type="text"
              name="publishedNumber"
              value={formData.publishedNumber}
              onChange={handleChange}
              placeholder="Enter the number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading || loadingGames}
            >
              {loading ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PublishResultModal;
