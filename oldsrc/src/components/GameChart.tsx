import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface GameChartProps {
  gameName: string;
  onClose: () => void;
}

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

function GameChart({ gameName, onClose }: GameChartProps) {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/results');

        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }

        const allResults = await response.json();
        // Filter results for this game
        const gameResults = allResults.filter((result: Result) => result.name === gameName);
        setResults(gameResults);
      } catch (err) {
        console.error('Error fetching results:', err);
        setError('Failed to load results. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [gameName]);

  // Generate calendar for current month
  const generateCalendar = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const calendarDays = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format

      // Find result for this date
      const dayResult = results.find(result => {
        const resultDate = new Date(result.createdAt).toISOString().split('T')[0];
        return resultDate === dateString;
      });

      calendarDays.push({
        day,
        date,
        result: dayResult ? dayResult.result : null,
        isPast: date < new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        isToday: date.toDateString() === new Date().toDateString()
      });
    }

    return calendarDays;
  };

  const calendarDays = generateCalendar();

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-amber-950/90 via-neutral-900 to-amber-950/90 rounded-xl border-2 border-yellow-600/40 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-yellow-600/30">
          <div>
            <h2 className="text-2xl font-bold text-yellow-400">{gameName}</h2>
            <p className="text-gray-400 text-sm">
              {new Date().toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-yellow-400 hover:text-yellow-300 transition-colors p-2 hover:bg-yellow-600/10 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-yellow-400">Loading results...</div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 mb-4">{error}</div>
              <button
                onClick={() => window.location.reload()}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-yellow-400 font-semibold text-sm py-2">
                  {day}
                </div>
              ))}

              {/* Empty cells for days before the first day of the month */}
              {Array.from({ length: new Date(calendarDays[0].date.getFullYear(), calendarDays[0].date.getMonth(), 1).getDay() }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square"></div>
              ))}

              {/* Calendar days */}
              {calendarDays.map(({ day, result, isPast, isToday }) => (
                <div
                  key={day}
                  className={`aspect-square rounded-lg border flex flex-col items-center justify-center text-sm font-semibold transition-all ${
                    isToday
                      ? 'bg-yellow-600/20 border-yellow-400 text-yellow-400'
                      : isPast
                      ? result
                        ? 'bg-green-600/20 border-green-500 text-green-400'
                        : 'bg-gray-600/20 border-gray-500 text-gray-400'
                      : 'bg-neutral-800/50 border-neutral-600 text-neutral-500'
                  }`}
                >
                  <div className="text-xs mb-1">{day}</div>
                  <div className="text-lg">
                    {result ? result : isPast ? '--' : '--'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600/20 border border-green-500 rounded"></div>
              <span className="text-gray-300">Result Declared</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-600/20 border border-yellow-400 rounded"></div>
              <span className="text-gray-300">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-600/20 border border-gray-500 rounded"></div>
              <span className="text-gray-300">No Result</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-neutral-800/50 border border-neutral-600 rounded"></div>
              <span className="text-gray-300">Future Date</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameChart;
