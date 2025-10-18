import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Result {
  _id: string;
  game: { name: string };
  numbers: number[];
  date: string;
}

const GameChart: React.FC = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>('');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await axios.get('/api/results');
      setResults(response.data);
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const games = [...new Set(results.map(result => result.game.name))];

  const filteredResults = selectedGame
    ? results.filter(result => result.game.name === selectedGame)
    : results;

  const chartData = {
    labels: filteredResults.map(result => result.date.split('T')[0]),
    datasets: [
      {
        label: 'Numbers',
        data: filteredResults.map(result => result.numbers.reduce((a, b) => a + b, 0)),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: selectedGame ? `${selectedGame} Results Chart` : 'All Games Results Chart',
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Game Results Chart</h1>

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
              <option key={game} value={game}>{game}</option>
            ))}
          </select>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <Bar data={chartData} options={options} />
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Results</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredResults.slice(0, 10).map((result) => (
                <li key={result._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{result.game.name}</h3>
                      <p className="text-sm text-gray-500">Numbers: {result.numbers.join('-')}</p>
                      <p className="text-xs text-gray-400">Date: {new Date(result.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameChart;
