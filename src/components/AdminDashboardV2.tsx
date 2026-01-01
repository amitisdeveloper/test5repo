import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatGameDate } from '../utils/timezone';

interface Result {
  _id: string;
  name: string;
  time: string;
  left: string;
  center: string;
  right: string;
  result: string;
  createdAt: string;
}

interface ApiResponse {
  results: Result[];
}

function AdminDashboardV2() {
  const [results, setResults] = useState<Result[]>([]);
  const [groupedResults, setGroupedResults] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // Initial load
  useEffect(() => {
    fetchResults();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  const handleCreateGame = () => {
    navigate('/admin/create-game');
  };

  const fetchResults = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/results', {
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

      const resultsArray: Result[] = await response.json();
      console.log('Results:', resultsArray);

      setResults(resultsArray);

      // Group results by game name and date
      const grouped = resultsArray.reduce((acc, result) => {
        const date = new Date(result.createdAt).toDateString();
        const key = `${result.name}-${date}`;
        if (!acc[key]) {
          acc[key] = {
            gameName: result.name,
            date: date,
            results: []
          };
        }
        acc[key].results.push(result);
        return acc;
      }, {} as any);

      setGroupedResults(grouped);
      setError('');
    } catch (err) {
      console.error('Error fetching results:', err);
      setError(`Failed to fetch results: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setResults([]);
      setGroupedResults({});
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-950/80 to-neutral-900 border-b border-yellow-600/30 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-yellow-400">Admin Dashboard V2</h1>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 text-sm"
            >
              ← Back to Dashboard V1
            </button>
          </div>
          <div className="flex gap-4">
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
        <h2 className="text-xl font-semibold text-yellow-400 mb-6">Results Management - Grouped by Game and Date</h2>

        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 border border-red-600/30 rounded-lg p-3 mb-6">
            {error}
          </div>
        )}


        {/* Data Table */}
        <div className="bg-gradient-to-br from-amber-950/70 via-neutral-900 to-amber-950/70 rounded-lg p-6 border-2 border-yellow-600/40">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">Results Grouped by Game and Date</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-300">
              <thead>
                <tr className="border-b border-yellow-600/30">
                  <th className="text-left py-3 px-4 text-yellow-400">Game Name</th>
                  <th className="text-left py-3 px-4 text-yellow-400">Date</th>
                  <th className="text-left py-3 px-4 text-yellow-400">Results</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(groupedResults).map((group: any) => (
                  <tr key={`${group.gameName}-${group.date}`} className="border-b border-yellow-600/20 hover:bg-amber-950/20">
                    <td className="py-4 px-4 font-semibold text-white">{group.gameName}</td>
                    <td className="py-4 px-4 text-gray-400">
                      {formatGameDate(group.date)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-2">
                        {group.results.map((result: Result, index: number) => (
                          <div key={result._id} className="bg-green-900/50 text-green-400 px-3 py-1 rounded text-sm border border-green-600/30">
                            {result.result} ({result.time})
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {Object.keys(groupedResults).length === 0 && !loading && (
          <div className="text-center text-gray-400 mt-12">
            <p>No results found.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboardV2;