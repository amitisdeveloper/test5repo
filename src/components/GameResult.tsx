import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Game {
  _id: string;
  name: string;
  description: string;
  status: string;
}

interface Result {
  _id: string;
  game: { name: string };
  numbers: number[];
  date: string;
  createdBy: { username: string };
}

const GameResult: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>('');

  useEffect(() => {
    fetchGames();
    fetchResults();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await axios.get('/api/games');
      setGames(response.data.filter((game: Game) => game.status === 'active'));
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  const fetchResults = async () => {
    try {
      const response = await axios.get('/api/results');
      setResults(response.data);
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const filteredResults = selectedGame
    ? results.filter(result => result.game.name === selectedGame)
    : results;

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">555 Results</h1>

        <div className="mb-8">
          <label htmlFor="game-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Game:
          </label>
          <select
            id="game-select"
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">All Games</option>
            {games.map(game => (
              <option key={game._id} value={game.name}>{game.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {games.map(game => (
            <div key={game._id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">G</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {game.name}
                      </dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">
                          {game.description}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {selectedGame ? `${selectedGame} Results` : 'All Results'}
            </h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {filteredResults.map((result) => (
              <li key={result._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {result.numbers.join('')}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {result.game.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Numbers: {result.numbers.join('-')}
                      </div>
                      <div className="text-xs text-gray-400">
                        Date: {new Date(result.date).toLocaleDateString()} | By: {result.createdBy.username}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GameResult;
