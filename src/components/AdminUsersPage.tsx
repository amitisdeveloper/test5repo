import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { API_BASE } from '../utils/api';
import { useAdminPresence } from '../hooks/useAdminPresence';

interface AdminUser {
  _id: string;
  name: string;
  phoneNumber: string;
  userId: string;
  username: string;
  role?: string;
  isActive: boolean;
  createdAt: string;
  assignedGames?: { _id: string; name?: string; nickName?: string; resultTime?: string | null }[];
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface CredentialPreview {
  userId: string;
  username: string;
  password: string;
}

interface GameOption {
  _id: string;
  name?: string;
  nickName?: string;
  resultTime?: string | null;
}

interface UserModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  user: AdminUser | null;
}

function AdminUsersPage() {
  const navigate = useNavigate();
  useAdminPresence('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [credentialsMessage, setCredentialsMessage] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    status: 'all'
  });
  const [modalState, setModalState] = useState<UserModalState>({
    isOpen: false,
    mode: 'create',
    user: null
  });
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    username: '',
    password: '',
    assignedGameIds: [] as string[],
    isActive: true
  });
  const [credentialPreview, setCredentialPreview] = useState<CredentialPreview | null>(null);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [availableGames, setAvailableGames] = useState<GameOption[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [filters.status]);

  const getToken = () => localStorage.getItem('token');

  const handleUnauthorized = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/admin/login');
  };

  const fetchUsers = async (
    page = 1,
    activeFilters: { search: string; status: string } = filters
  ) => {
    try {
      setLoading(true);
      setError('');
      const token = getToken();
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        status: activeFilters.status,
        search: activeFilters.search.trim()
      });

      const response = await fetch(`${API_BASE}/admin/users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      setUsers(Array.isArray(data.users) ? data.users : []);
      setPagination(data.pagination || null);
    } catch (err) {
      setUsers([]);
      setPagination(null);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchNextCredentials = async () => {
    try {
      setLoadingCredentials(true);
      const token = getToken();
      const response = await fetch(`${API_BASE}/admin/users/next-credentials`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to generate credentials');
      }

      setCredentialPreview(data);
      setFormData((prev) => ({
        ...prev,
        username: data.username,
        password: data.password
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate credentials');
    } finally {
      setLoadingCredentials(false);
    }
  };

  const fetchAssignableGames = async () => {
    try {
      setLoadingGames(true);
      const token = getToken();
      const response = await fetch(`${API_BASE}/games/admin/active-games`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to load active games');
      }

      setAvailableGames(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load active games');
    } finally {
      setLoadingGames(false);
    }
  };

  const openCreateModal = async () => {
    setModalState({ isOpen: true, mode: 'create', user: null });
    setFormData({
      name: '',
      phoneNumber: '',
      username: '',
      password: '',
      assignedGameIds: [] as string[],
      isActive: true
    });
    setCredentialPreview(null);
    setCredentialsMessage('');
    await fetchAssignableGames();
    await fetchNextCredentials();
  };

  const openEditModal = (user: AdminUser) => {
    setModalState({ isOpen: true, mode: 'edit', user });
    setFormData({
      name: user.name || '',
      phoneNumber: user.phoneNumber || '',
      username: user.username || '',
      password: '',
      assignedGameIds: (user.assignedGames || []).map((game) => game._id),
      isActive: user.isActive
    });
    setCredentialPreview({
      userId: user.userId,
      username: user.username,
      password: '******'
    });
    setCredentialsMessage('');
    fetchAssignableGames();
  };

  const closeModal = () => {
    setModalState({ isOpen: false, mode: 'create', user: null });
    setFormData({
      name: '',
      phoneNumber: '',
      username: '',
      password: '',
      assignedGameIds: [] as string[],
      isActive: true
    });
    setCredentialPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      setCredentialsMessage('');
      const token = getToken();
      const endpoint = modalState.mode === 'create'
        ? `${API_BASE}/admin/users`
        : `${API_BASE}/admin/users/${modalState.user?._id}`;
      const method = modalState.mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      setSuccess(data.message || 'User saved successfully');

      if (data.credentials) {
        setCredentialsMessage(
          `Username: ${data.credentials.username} | Password: ${data.credentials.password}`
        );
      }

      closeModal();

      if (modalState.mode === 'create') {
        const resetFilters = { search: '', status: 'all' };
        setFilters(resetFilters);
        await fetchUsers(1, resetFilters);
      } else {
        await fetchUsers(pagination?.currentPage || 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user: AdminUser) => {
    const confirmed = window.confirm(`Delete user ${user.userId} (${user.name})?`);
    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      setCredentialsMessage('');
      const token = getToken();
      const response = await fetch(`${API_BASE}/admin/users/${user._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      setSuccess(data.message || 'User deleted successfully');
      await fetchUsers(pagination?.currentPage || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleSearchSubmit = () => {
    fetchUsers(1);
  };

  const handleClearFilters = () => {
    const resetFilters = { search: '', status: 'all' };
    setFilters(resetFilters);
    fetchUsers(1, resetFilters);
  };

  const activeUsers = users.filter((user) => user.isActive).length;
  const inactiveUsers = users.filter((user) => !user.isActive).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      <header className="bg-gradient-to-r from-amber-950/80 to-neutral-900 border-b border-yellow-600/30 p-4">
        <div className="container mx-auto flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-yellow-400">User Management</h1>
            <p className="text-sm text-gray-400">Create and manage shiftwise app users</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-4 py-2 rounded-lg hover:from-slate-700 hover:to-slate-800 transition-all duration-300"
            >
              Back to Dashboard
            </button>
            <button
              onClick={openCreateModal}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300"
            >
              Create User
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                navigate('/admin/login');
              }}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 border border-red-600/30 rounded-lg p-4">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-400 text-sm bg-green-900/20 border border-green-600/30 rounded-lg p-4">
            {success}
          </div>
        )}

        {credentialsMessage && (
          <div className="text-blue-300 text-sm bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
            {credentialsMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-950/70 via-neutral-900 to-blue-950/70 rounded-lg p-4 border border-blue-600/30">
            <div className="text-blue-400 text-sm font-medium">Total Users</div>
            <div className="text-2xl font-bold text-white">{pagination?.totalItems || 0}</div>
          </div>
          <div className="bg-gradient-to-br from-green-950/70 via-neutral-900 to-green-950/70 rounded-lg p-4 border border-green-600/30">
            <div className="text-green-400 text-sm font-medium">Active Users</div>
            <div className="text-2xl font-bold text-white">{activeUsers}</div>
          </div>
          <div className="bg-gradient-to-br from-red-950/70 via-neutral-900 to-red-950/70 rounded-lg p-4 border border-red-600/30">
            <div className="text-red-400 text-sm font-medium">Inactive Users</div>
            <div className="text-2xl font-bold text-white">{inactiveUsers}</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-950/70 via-neutral-900 to-amber-950/70 rounded-lg p-6 border-2 border-yellow-600/40">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-yellow-400 mb-2">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                placeholder="Search by name, phone, user ID"
                className="w-full px-4 py-3 bg-neutral-800 border border-yellow-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-yellow-400 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-3 bg-neutral-800 border border-yellow-600/30 rounded-lg text-white focus:outline-none focus:border-yellow-400"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleSearchSubmit}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300"
              >
                Apply
              </button>
              <button
                onClick={handleClearFilters}
                className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-3 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-950/70 via-neutral-900 to-amber-950/70 rounded-lg p-6 border-2 border-yellow-600/40">
          {loading ? (
            <div className="text-yellow-400">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-gray-400 text-center py-10">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-300">
                <thead>
                  <tr className="border-b border-yellow-600/30">
                    <th className="text-left py-3 px-4 text-yellow-400">Name</th>
                    <th className="text-left py-3 px-4 text-yellow-400">Phone</th>
                    <th className="text-left py-3 px-4 text-yellow-400">User ID</th>
                    <th className="text-left py-3 px-4 text-yellow-400">Username</th>
                    <th className="text-left py-3 px-4 text-yellow-400">Assigned Shifts</th>
                    <th className="text-left py-3 px-4 text-yellow-400">Status</th>
                    <th className="text-left py-3 px-4 text-yellow-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b border-yellow-600/20 hover:bg-amber-950/20">
                      <td className="py-4 px-4 text-white font-medium">{user.name}</td>
                      <td className="py-4 px-4">{user.phoneNumber}</td>
                      <td className="py-4 px-4">{user.userId}</td>
                      <td className="py-4 px-4">{user.username}</td>
                      <td className="py-4 px-4">
                        {(user.assignedGames || []).length > 0
                          ? user.assignedGames!.map((game) => `${game.nickName || game.name}${game.resultTime ? ` (${game.resultTime})` : ''}`).join(', ')
                          : 'No shifts assigned'}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          user.isActive
                            ? 'bg-green-900/50 text-green-400 border-green-600/30'
                            : 'bg-red-900/50 text-red-400 border-red-600/30'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="bg-gradient-to-r from-yellow-600 to-amber-600 text-white px-3 py-2 rounded-lg hover:from-yellow-700 hover:to-amber-700 transition-all duration-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between bg-gradient-to-br from-amber-950/70 via-neutral-900 to-amber-950/70 rounded-lg p-4 border-2 border-yellow-600/40">
            <div className="text-sm text-gray-300">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchUsers(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="px-4 py-2 bg-neutral-800 border border-yellow-600/30 rounded-lg text-white disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => fetchUsers(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="px-4 py-2 bg-neutral-800 border border-yellow-600/30 rounded-lg text-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>

      {modalState.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-amber-950/90 via-neutral-900 to-amber-950/90 rounded-xl border-2 border-yellow-600/40 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-yellow-600/30">
              <h2 className="text-2xl font-bold text-yellow-400">
                {modalState.mode === 'create' ? 'Create User' : 'Edit User'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-neutral-800 border border-yellow-600/30 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">Phone Number *</label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                  className="w-full px-4 py-3 bg-neutral-800 border border-yellow-600/30 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">User ID</label>
                <input
                  type="text"
                  value={credentialPreview?.userId || ''}
                  className="w-full px-4 py-3 bg-neutral-800/60 border border-yellow-600/20 rounded-lg text-gray-300"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-3 bg-neutral-800 border border-yellow-600/30 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                  placeholder="Enter username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">Assigned Shifts</label>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-yellow-600/20 bg-neutral-900/40 p-3">
                  {loadingGames ? (
                    <div className="text-sm text-gray-400">Loading shifts...</div>
                  ) : availableGames.length === 0 ? (
                    <div className="text-sm text-gray-400">No active shifts available.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {availableGames.map((game) => {
                        const checked = formData.assignedGameIds.includes(game._id);
                        return (
                          <label key={game._id} className="flex items-center gap-3 text-sm text-gray-200 min-w-0">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  assignedGameIds: e.target.checked
                                    ? [...prev.assignedGameIds, game._id]
                                    : prev.assignedGameIds.filter((id) => id !== game._id)
                                }));
                              }}
                              className="w-4 h-4 shrink-0"
                            />
                            <span className="truncate">
                              {`${game.nickName || game.name}${game.resultTime ? ` (${game.resultTime})` : ''}`}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">
                  Password *
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    className="flex-1 px-4 py-3 bg-neutral-800 border border-yellow-600/30 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                    placeholder="Enter password"
                    required={modalState.mode === 'create'}
                  />
                  <button
                    type="button"
                    onClick={fetchNextCredentials}
                    disabled={loadingCredentials}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
                    title="Generate username and password"
                  >
                    <RefreshCw size={18} className={loadingCredentials ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-yellow-400">
                  Active user
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting || (modalState.mode === 'create' && !credentialPreview)}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : modalState.mode === 'create' ? 'Create User' : 'Update User'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold py-3 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsersPage;
