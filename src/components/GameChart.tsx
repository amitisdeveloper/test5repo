import { useEffect, useState } from 'react';

interface GameChartProps {
  gameName: string;
  onClose: () => void;
}

function GameChart({ gameName, onClose }: GameChartProps) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(0);
  const [istYear, setIstYear] = useState(0);

  useEffect(() => {
    fetchISTDate();
    fetchResults();
  }, [gameName]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const fetchISTDate = async () => {
    try {
      const response = await fetch('/api/games');
      if (response.ok) {
        const data = await response.json();
        const todayIST = data.todayDateIST_YYYYMMDD || new Date().toISOString().split('T')[0];
        const [year, month] = todayIST.split('-').slice(0, 2).map(Number);
        setIstYear(year);
        setSelectedMonth(month - 1);
        setSelectedYear(year);
      }
    } catch (error) {
      console.error('Error fetching IST date:', error);
      const today = new Date();
      setSelectedMonth(today.getMonth());
      setSelectedYear(today.getFullYear());
      setIstYear(today.getFullYear());
    }
  };

  const fetchResults = async () => {
    try {
      setLoading(true);
      const gamesResponse = await fetch('/api/games');
      let gameId = '';

      if (gamesResponse.ok) {
        const gamesData = await gamesResponse.json();
        const games = Array.isArray(gamesData.games) ? gamesData.games : [];
        const selectedGame = games.find((game: any) => game.nickName === gameName);
        gameId = selectedGame?._id || '';
      }

      const response = await fetch(`/api/admin/game-results?limit=1000${gameId ? `&gameId=${gameId}` : ''}`);

      if (response.ok) {
        const data = await response.json();
        const filteredResults = data.results.filter((r: any) => r.gameId.nickName === gameName);
        const transformedResults = filteredResults.map((r: any) => ({
          result: r.publishedNumber,
          name: r.gameId.nickName,
          time: r.gameId.resultTime || '02:00 PM',
          createdAt: r.publishDate,
          displayDate: r.publishDate
        }));

        setResults(transformedResults);
      } else {
        console.error('Failed to fetch published results');
        setResults([]);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getISTDateParts = (dateStr: string) => {
    const d = new Date(dateStr);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(d);
    return {
      year: parseInt(parts.find(p => p.type === 'year')!.value),
      month: parseInt(parts.find(p => p.type === 'month')!.value) - 1,
      day: parseInt(parts.find(p => p.type === 'day')!.value)
    };
  };

  const filteredResults = results.filter((result) => {
    const { month, year } = getISTDateParts(result.displayDate || result.createdAt);
    return month === selectedMonth && year === selectedYear;
  });

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const resultsByDay = daysArray.map((day) => {
    const dayResults = filteredResults.filter((result) => {
      const { day: d } = getISTDateParts(result.displayDate || result.createdAt);
      return d === day;
    });

    return dayResults.length > 0 ? dayResults[0] : null;
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = istYear || new Date().getFullYear();
  const years = Array.from(
    { length: Math.max(0, currentYear - 2025 + 1) },
    (_, index) => currentYear - index
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-amber-950/90 via-neutral-900 to-amber-950/90 rounded-xl p-6 border-2 border-yellow-600/40 shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-yellow-400">{gameName} Chart</h2>
          <button
            onClick={onClose}
            className="text-yellow-400 hover:text-yellow-300 text-sm font-semibold underline underline-offset-4"
          >
            Close
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          <div>
            <label className="block text-yellow-400 text-sm font-semibold mb-2">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="bg-neutral-900/50 border border-yellow-600/40 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-400"
            >
              {monthNames.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-yellow-400 text-sm font-semibold mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-neutral-900/50 border border-yellow-600/40 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-400"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-yellow-400">Loading chart...</div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-4">
              Results for {monthNames[selectedMonth]} {selectedYear}
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
                  {daysArray.map((day) => {
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
        )}
      </div>
    </div>
  );
}

export default GameChart;
