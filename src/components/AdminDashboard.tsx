import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { formatGameDate } from '../utils/timezone';
import TimePicker from './TimePicker';

interface Game {
  _id: string;
  nickName: string;
  isActive: boolean;
  resultTime?: string | null;
  resultDate?: Date | null;
  latestResult?: {
    result: string;
    date: string;
    time: string;
  } | null;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ApiResponse {
  games: Game[];
  pagination: PaginationInfo;
  filters: {
    startDate?: string;
    endDate?: string;
    search?: string;
  };
}

// Modal component for Create/Edit operations
interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  game?: Game | null;
  mode: 'create' | 'edit' | 'publish';
  onSubmit: (data: any) => Promise<void>;
}

function GameModal({ isOpen, onClose, game, mode, onSubmit }: GameModalProps) {
  const [formData, setFormData] = useState({
    nickName: '',
    isActive: true,
    result: '',
    resultTime: '',
    resultDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (game && (mode === 'edit' || mode === 'publish')) {
      setFormData({
        nickName: game.nickName || '',
        isActive: game.isActive,
        result: game.latestResult?.result || '',
        resultTime: game.resultTime || '',
        resultDate: game.resultDate ? new Date(game.resultDate).toISOString().split('T')[0] : ''
      });
    } else if (mode === 'create') {
      setFormData({
        nickName: '',
        isActive: true,
        result: '',
        resultTime: '',
        resultDate: ''
      });
    }
    setError('');
    setValidationError('');
  }, [game, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setValidationError('');

    // Validate Result Time is selected
    if (!formData.resultTime) {
      setValidationError('Result Time is required');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'publish') {
        await onSubmit({
          result: formData.result,
          gameId: game?._id
        });
      } else {
        await onSubmit(formData);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'create': return 'Create New Game';
      case 'edit': return 'Edit Game';
      case 'publish': return 'Publish Game Result';
      default: return 'Game Modal';
    }
  };

  const getSubmitButtonText = () => {
    if (loading) {
      switch (mode) {
        case 'create': return 'Creating...';
        case 'edit': return 'Updating...';
        case 'publish': return 'Publishing...';
        default: return 'Loading...';
      }
    }
    switch (mode) {
      case 'create': return 'Create Game';
      case 'edit': return 'Update Game';
      case 'publish': return 'Publish Result';
      default: return 'Submit';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-amber-950/90 via-neutral-900 to-amber-950/90 rounded-xl border-2 border-yellow-600/40 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-yellow-600/30">
          <h2 className="text-2xl font-bold text-yellow-400">{getModalTitle()}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {mode !== 'publish' && (
            <>
              {/* Game Name */}
              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">
                  Game Name *
                </label>
                <input
                  type="text"
                  value={formData.nickName}
                  onChange={(e) => setFormData({ ...formData, nickName: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-800 border border-yellow-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                  placeholder="Enter game name"
                  required
                  disabled={mode === 'edit' && !!game?.latestResult}
                />
              </div>


              {/* Result Time */}
              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">
                  Result Time *
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

              {/* Result Date */}
              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">
                  Result Date
                </label>
                <input
                  type="date"
                  value={formData.resultDate}
                  onChange={(e) => setFormData({ ...formData, resultDate: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-800 border border-yellow-600/30 rounded-lg text-white focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                />
                <p className="text-gray-400 text-sm mt-1">
                  Choose the date when this game's result will be announced (leave empty for same day)
                </p>
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-yellow-600 bg-neutral-800 border-yellow-600/30 rounded focus:ring-yellow-500 focus:ring-2"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-yellow-400">
                  Active Game
                </label>
              </div>
            </>
          )}

          {mode === 'publish' && (
            <div>
              <label className="block text-sm font-medium text-yellow-400 mb-2">
                Game Result *
              </label>
              <input
                type="text"
                value={formData.result}
                onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                className="w-full px-4 py-3 bg-neutral-800 border border-yellow-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                placeholder="Enter the game result"
                required
              />
              <p className="text-gray-400 text-sm mt-1">
                Publishing result for: <span className="text-yellow-400 font-medium">{game?.nickName}</span>
              </p>
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-600/30 rounded-lg p-3">
              {validationError}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-600/30 rounded-lg p-3">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {getSubmitButtonText()}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold py-3 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [games, setGames] = useState<Game[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    search: ''
  });

  // Modal states
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit' | 'publish';
    game: Game | null;
  }>({
    isOpen: false,
    mode: 'create',
    game: null
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchGames();
  }, [filters, modalState.isOpen]); // Refetch when filters change or modal closes

  const API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

  const fetchGames = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      });

      const response = await fetch(`${API_BASE}/games/admin?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/admin/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      console.log('API Response:', data);

      // Ensure games is always an array
      const gamesArray = Array.isArray(data.games) ? data.games : [];
      setGames(gamesArray);
      setPagination(data.pagination || null);
      setError('');
    } catch (err) {
      console.error('Error fetching games:', err);
      setError(`Failed to fetch games: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setGames([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  const openModal = (mode: 'create' | 'edit' | 'publish', game?: Game) => {
    setModalState({
      isOpen: true,
      mode,
      game: game || null
    });
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      mode: 'create',
      game: null
    });
    setError('');
    setSuccess('');
  };

  const handleGameSubmit = async (data: any) => {
    try {
      setError('');
      const token = localStorage.getItem('token');

      if (modalState.mode === 'create') {
        const response = await fetch(`${API_BASE}/games`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        setSuccess('Game created successfully!');
      } else if (modalState.mode === 'edit') {
        const response = await fetch(`${API_BASE}/games/${modalState.game!._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        setSuccess('Game updated successfully!');
      }
      
      // Refresh games list
      await fetchGames();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!window.confirm('Are you sure you want to delete this game? This will also delete all published results for this game.')) {
      return;
    }

    try {
      setError('');
      const token = localStorage.getItem('token');
      console.log('Starting delete for game:', gameId);
      
      const response = await fetch(`${API_BASE}/games/${gameId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Delete response status:', response.status);

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/admin/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Delete response data:', responseData);

      setSuccess('Game and associated results deleted successfully!');
      
      console.log('Refetching games from page:', pagination?.currentPage || 1);
      await fetchGames(pagination?.currentPage || 1);
      
    } catch (err) {
      console.error('Error deleting game:', err);
      setError(`Failed to delete game: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handlePublishResult = async (data: any) => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          gameId: data.gameId,
          result: data.result,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setSuccess('Result published successfully!');
      await fetchGames();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleApplyFilters = () => {
    fetchGames(1); // Reset to first page when applying filters
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      search: ''
    });
    fetchGames(1);
  };

  const handlePageChange = (page: number) => {
    fetchGames(page);
  };

  const getStatusBadge = (game: Game) => {
    if (!game.isActive) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-400 border border-red-600/30">
          Inactive
        </span>
      );
    }

    if (game.latestResult) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-400 border border-green-600/30">
          Completed
        </span>
      );
    }

    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-400 border border-blue-600/30">
        Active
      </span>
    );
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
              onClick={() => openModal('create')}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300"
            >
              Create Game
            </button>
            <button
              onClick={() => navigate('/admin/dashboard-v2')}
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300"
            >
              Dashboard V2
            </button>
            <button
              onClick={() => navigate('/admin/game-results')}
              className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white px-4 py-2 rounded-lg hover:from-cyan-700 hover:to-cyan-800 transition-all duration-300"
            >
              Published Results
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

        {/* Status Messages */}
        {error && (
          <div className="mb-6 text-red-400 text-sm bg-red-900/20 border border-red-600/30 rounded-lg p-4">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 text-green-400 text-sm bg-green-900/20 border border-green-600/30 rounded-lg p-4">
            {success}
          </div>
        )}

        {/* Enhanced Filters */}
        <div className="bg-gradient-to-br from-amber-950/70 via-neutral-900 to-amber-950/70 rounded-lg p-6 border-2 border-yellow-600/40 mb-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">Filters & Search</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-yellow-400 mb-2">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                placeholder="Search by name..."
                className="w-full px-3 py-2 bg-neutral-800 border border-yellow-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-yellow-400 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange({ startDate: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-800 border border-yellow-600/30 rounded-lg text-white focus:outline-none focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-yellow-400 mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange({ endDate: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-800 border border-yellow-600/30 rounded-lg text-white focus:outline-none focus:border-yellow-400"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleApplyFilters}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300"
              >
                Apply
              </button>
              <button
                onClick={handleClearFilters}
                className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-950/70 via-neutral-900 to-blue-950/70 rounded-lg p-4 border border-blue-600/30">
            <div className="text-blue-400 text-sm font-medium">Total Games</div>
            <div className="text-2xl font-bold text-white">{pagination?.totalItems || 0}</div>
          </div>
          <div className="bg-gradient-to-br from-green-950/70 via-neutral-900 to-green-950/70 rounded-lg p-4 border border-green-600/30">
            <div className="text-green-400 text-sm font-medium">Active Games</div>
            <div className="text-2xl font-bold text-white">
              {games.filter(g => g.isActive && !g.latestResult).length}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-950/70 via-neutral-900 to-purple-950/70 rounded-lg p-4 border border-purple-600/30">
            <div className="text-purple-400 text-sm font-medium">Completed</div>
            <div className="text-2xl font-bold text-white">
              {games.filter(g => g.latestResult).length}
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-950/70 via-neutral-900 to-amber-950/70 rounded-lg p-4 border border-amber-600/30">
            <div className="text-amber-400 text-sm font-medium">Inactive</div>
            <div className="text-2xl font-bold text-white">
              {games.filter(g => !g.isActive).length}
            </div>
          </div>
        </div>

        {/* Game Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Array.isArray(games) && games.map(game => (
            <div key={game._id} className="bg-gradient-to-br from-amber-950/70 via-neutral-900 to-amber-950/70 rounded-lg p-6 border-2 border-yellow-600/40">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-yellow-400">{game.nickName}</h3>
                </div>
                {getStatusBadge(game)}
              </div>

              {/* Result Time Display - Prominent */}
              {game.resultTime && (
                <div className="mb-3 p-3 bg-gradient-to-r from-blue-900/40 to-blue-800/40 border border-blue-500/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-blue-300 text-sm font-medium">Result Time</span>
                  </div>
                  <p className="text-white font-bold text-lg mt-1">{game.resultTime}</p>
                </div>
              )}

              <div className="text-sm text-gray-300">
                {game.latestResult && (
                  <div className="p-2 bg-green-900/20 border border-green-600/30 rounded">
                    <p className="text-green-400 font-semibold">Latest Result: {game.latestResult.result}</p>
                    <p className="text-gray-400 text-xs">
                      {formatGameDate(game.latestResult.date)} {game.latestResult.time}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openModal('edit', game)}
                  className="flex-1 bg-gradient-to-r from-yellow-600 to-amber-600 text-white px-3 py-2 rounded-lg hover:from-yellow-700 hover:to-amber-700 transition-all duration-300 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteGame(game._id)}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>


        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="bg-gradient-to-br from-amber-950/70 via-neutral-900 to-amber-950/70 rounded-lg p-6 border-2 border-yellow-600/40 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-300">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} games
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-2 bg-neutral-800 border border-yellow-600/30 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700 transition-colors"
                >
                  Previous
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, pagination.currentPage - 2)) + i;
                  if (pageNum > pagination.totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 border rounded-lg transition-colors ${
                        pageNum === pagination.currentPage
                          ? 'bg-yellow-600 border-yellow-400 text-white'
                          : 'bg-neutral-800 border-yellow-600/30 text-white hover:bg-neutral-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-2 bg-neutral-800 border border-yellow-600/30 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {Array.isArray(games) && games.length === 0 && !loading && (
          <div className="text-center text-gray-400 mt-12">
            <p>No games found. Try adjusting your filters or create a new game!</p>
          </div>
        )}
      </main>

      {/* Game Modal */}
      <GameModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        game={modalState.game}
        mode={modalState.mode}
        onSubmit={modalState.mode === 'publish' ? handlePublishResult : handleGameSubmit}
      />
    </div>
  );
}

export default AdminDashboard;
