import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Game {
  _id: string;
  name: string;
  description: string;
  status: string;
  createdBy: { username: string };
  createdAt: string;
}

interface Result {
  _id: string;
  game: { name: string };
  numbers: number[];
  date: string;
  createdBy: { username: string };
}

const AdminDashboard: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [activeTab, setActiveTab] = useState('games');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    fetchGames();
    fetchResults();
  }, [navigate]);

  const fetchGames = async () => {
    try {
      const response = await axios.get('/api/games', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setGames(response.data);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  const fetchResults = async () => {
    try {
      const response = await axios.get('/api/results', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setResults(response.data);
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  const toggleGameStatus = async (gameId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await axios.put(`/api/games/${gameId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchGames();
    } catch (error) {
      console.error('Error updating game status:', error);
    }
  };

  const deleteGame = async (gameId: string) => {
    if (window.confirm('Are you sure you want to delete this game?')) {
      try {
        await axios.delete(`/api/games/${gameId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        fetchGames();
      } catch (error) {
        console.error('Error deleting game:', error);
      }
    }
  };

  const deleteResult = async (resultId: string) => {
    if (window.confirm('Are you sure you want to delete this result?')) {
      try {
        await axios.delete(`/api/results/${resultId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        fetchResults();
      } catch (error) {
        console.error('Error deleting result:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/create-game')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Create Game
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('games')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'games'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Games
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'results'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Results
              </button>
            </nav>
          </div>

          {activeTab === 'games' && (
            <div className="mt-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Games</h3>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {games.map((game) => (
                    <li key={game._id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{game.name}</h4>
                          <p className="text-sm text-gray-500">{game.description}</p>
                          <p className="text-xs text-gray-400">Created by: {game.createdBy.username}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            game.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {game.status}
                          </span>
                          <button
                            onClick={() => toggleGameStatus(game._id, game.status)}
                            className="text-indigo-600 hover:text-indigo-900 text-sm"
                          >
                            Toggle
                          </button>
                          <button
                            onClick={() => deleteGame(game._id)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="mt-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Results</h3>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {results.map((result) => (
                    <li key={result._id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{result.game.name}</h4>
                          <p className="text-sm text-gray-500">Numbers: {result.numbers.join('-')}</p>
                          <p className="text-xs text-gray-400">Created by: {result.createdBy.username}</p>
                          <p className="text-xs text-gray-400">Date: {new Date(result.date).toLocaleDateString()}</p>
                        </div>
                        <button
                          onClick={() => deleteResult(result._id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
