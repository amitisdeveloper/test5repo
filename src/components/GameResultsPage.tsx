import { useState, useEffect } from 'react';
import { Trash2, Edit2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PublishResultModal from './PublishResultModal';
import { formatGameDate } from '../utils/timezone';

interface GameResult {
  _id: string;
  gameId: {
    _id: string;
    name: string;
    nickName?: string;
  };
  publishDate: string;
  publishedNumber: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

function GameResultsPage() {
  const navigate = useNavigate();
  const [results, setResults] = useState<GameResult[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNumber, setEditNumber] = useState('');
  const [editError, setEditError] = useState('');

  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const token = localStorage.getItem('token');
  const API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

  // Fetch results
  const fetchResults = async (page: number = 1) => {
    try {
      setLoading(true);
      setError('');

      let url = `${API_BASE}/admin/game-results?page=${page}&limit=10`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }

      const data = await response.json();
      setResults(data.results);
      setPagination(data.pagination);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults(1);
  }, []);

  const handlePublishResult = async (data: {
    gameId: string;
    publishDate: string;
    publishedNumber: string;
  }) => {
    try {
      const response = await fetch(`${API_BASE}/admin/game-results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      setSuccessMessage('Result published successfully');
      setModalOpen(false);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchResults(1);
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const handleEdit = (result: GameResult) => {
    setEditingId(result._id);
    setEditNumber(result.publishedNumber);
    setEditError('');
  };

  const handleSaveEdit = async (resultId: string) => {
    try {
      if (!editNumber) {
        setEditError('Number is required');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/game-results/${resultId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ publishedNumber: editNumber })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      setSuccessMessage('Result updated successfully');
      setEditingId(null);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchResults(currentPage);
    } catch (err: any) {
      setEditError(err.message);
    }
  };

  const handleDelete = async (resultId: string) => {
    try {
      const response = await fetch(`${API_BASE}/admin/game-results/${resultId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      setSuccessMessage('Result deleted successfully');
      setDeleteConfirm(null);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchResults(currentPage);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
    fetchResults(1);
  };

  const handlePageChange = (newPage: number) => {
    fetchResults(newPage);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatGameDate(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      <header className="bg-gradient-to-r from-amber-950/80 to-neutral-900 border-b border-yellow-600/30 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-yellow-400 hover:text-yellow-300 transition"
              title="Back to Dashboard"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-yellow-400">Published Results</h1>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300"
          >
            + Publish Result
          </button>
        </div>
      </header>

      <main className="container mx-auto p-6">
        {successMessage && (
          <div className="p-3 mb-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Filter Section */}
        <div className="bg-gray-100 p-4 rounded-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleFilterChange}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                disabled={loading}
              >
                Apply Filter
              </button>
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setCurrentPage(1);
                }}
                className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          {loading && !results.length ? (
            <div className="p-8 text-center text-gray-500">Loading results...</div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No results found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Game Name</th>
                  <th className="px-6 py-3 text-left font-semibold">Publish Date</th>
                  <th className="px-6 py-3 text-left font-semibold">Published Number</th>
                  <th className="px-6 py-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map(result => (
                  <tr key={result._id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-3">
                      {result.gameId.name || result.gameId.nickName}
                    </td>
                    <td className="px-6 py-3">
                      {formatDate(result.publishDate)}
                    </td>
                    <td className="px-6 py-3">
                      {editingId === result._id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editNumber}
                            onChange={(e) => setEditNumber(e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded flex-1"
                          />
                          <button
                            onClick={() => handleSaveEdit(result._id)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="bg-gray-400 text-white px-3 py-1 rounded text-sm hover:bg-gray-500"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span>{result.publishedNumber}</span>
                      )}
                      {editingId === result._id && editError && (
                        <div className="text-red-600 text-sm mt-1">{editError}</div>
                      )}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {deleteConfirm === result._id ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleDelete(result._id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="bg-gray-400 text-white px-3 py-1 rounded text-sm hover:bg-gray-500"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(result)}
                            disabled={editingId !== null}
                            className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(result._id)}
                            disabled={editingId !== null}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.hasPrev || loading}
              className="px-3 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasNext || loading}
              className="px-3 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
            >
              Next
            </button>
          </div>
        )}

        <PublishResultModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handlePublishResult}
        />
      </main>
    </div>
  );
}

export default GameResultsPage;
