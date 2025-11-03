import { useState, useEffect } from 'react';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface GameChartProps {
  gameName: string;
  onClose: () => void;
}

function GameChart({ gameName, onClose }: GameChartProps) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchResults();
  }, [gameName]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/results');
      const data = await response.json();
      setResults(data.filter((r: any) => r.name === gameName));
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter results for selected month and year
  const filteredResults = results.filter(result => {
    const date = new Date(result.createdAt);
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
  });

  // Get days in selected month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Get results by day
  const resultsByDay = daysArray.map(day => {
    const dayResults = filteredResults.filter(result => {
      const date = new Date(result.createdAt);
      return date.getDate() === day;
    });
    return dayResults.length > 0 ? dayResults[0] : null;
  });

  const chartData = {
    labels: daysArray.map(day => `${day}`),
    datasets: [
      {
        label: 'Result',
        data: resultsByDay.map(result => result ? parseInt(result.result) : null),
        backgroundColor: 'rgba(255, 193, 7, 0.6)',
        borderColor: 'rgba(255, 193, 7, 1)',
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
        text: `${gameName} Results Chart - ${new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long' })} ${selectedYear}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-amber-950/90 via-neutral-900 to-amber-950/90 rounded-xl p-6 border-2 border-yellow-600/40 shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-yellow-400">{gameName} Chart</h2>
          <button
            onClick={onClose}
            className="text-yellow-400 hover:text-yellow-300 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Month and Year Selection */}
        <div className="flex gap-4 mb-6">
          <div>
            <label className="block text-yellow-400 text-sm font-semibold mb-2">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-neutral-900/50 border border-yellow-600/40 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-400"
            >
              {months.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-yellow-400 text-sm font-semibold mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-neutral-900/50 border border-yellow-600/40 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-400"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-yellow-400">Loading chart...</div>
        ) : (
          <>
            {/* Chart */}
            <div className="bg-neutral-900/50 rounded-lg p-4 mb-6">
              <Bar data={chartData} options={options} />
            </div>

            {/* Tabular Data */}
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-4">
                Results for {months[selectedMonth]} {selectedYear}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-300">
                  <thead>
                    <tr className="border-b border-yellow-600/30">
                      <th className="text-left py-2 px-4 text-yellow-400">Day</th>
                      <th className="text-left py-2 px-4 text-yellow-400">Result</th>
                      <th className="text-left py-2 px-4 text-yellow-400">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daysArray.map(day => {
                      const result = resultsByDay[day - 1];
                      return (
                        <tr key={day} className="border-b border-yellow-600/20 hover:bg-amber-950/20">
                          <td className="py-3 px-4 font-semibold text-white">{day}</td>
                          <td className="py-3 px-4">
                            {result ? (
                              <span className="text-green-400 font-bold">{result.result}</span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-gray-400">
                            {result ? result.time : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default GameChart;
