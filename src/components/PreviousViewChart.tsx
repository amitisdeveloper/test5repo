import { CalendarDays, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getDisawarDisplayDate } from '../utils/timezone';

interface PreviousViewChartProps {
  games: any[];
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getISTToday = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date()).split('-').map(Number);
  return { year: parts[0], month: parts[1] - 1 };
};

const getISTDateKey = (value: string) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date(value));

function PreviousViewChart({ games }: PreviousViewChartProps) {
  const today = getISTToday();
  const [selectedYear, setSelectedYear] = useState(today.year);
  const [selectedMonth, setSelectedMonth] = useState(today.month);
  const [chartPeriod, setChartPeriod] = useState({ year: today.year, month: today.month });
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const years = Array.from({ length: Math.max(1, today.year - 2025 + 1) }, (_, i) => today.year - i);
  const visibleGames = useMemo(() => games.filter(game => game?._id && (game.nickName || game.name)), [games]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchChart = async () => {
      setLoading(true);
      setError('');
      const startDate = `${chartPeriod.year}-${String(chartPeriod.month + 1).padStart(2, '0')}-01`;
      const finalDay = new Date(chartPeriod.year, chartPeriod.month + 1, 0).getDate();
      const endDate = `${chartPeriod.year}-${String(chartPeriod.month + 1).padStart(2, '0')}-${finalDay}`;
      try {
        const response = await fetch(`/api/admin/game-results?all=true&startDate=${startDate}&endDate=${endDate}`, {
          signal: controller.signal
        });
        if (!response.ok) throw new Error('Could not load chart results');
        const data = await response.json();
        setResults(Array.isArray(data.results) ? data.results : []);
      } catch (fetchError: any) {
        if (fetchError.name !== 'AbortError') {
          setResults([]);
          setError(fetchError.message || 'Could not load chart results');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchChart();
    return () => controller.abort();
  }, [chartPeriod]);

  const days = Array.from({ length: new Date(chartPeriod.year, chartPeriod.month + 1, 0).getDate() }, (_, i) => i + 1);
  const resultsMap = useMemo(() => {
    const map = new Map<string, string>();
    results.forEach(result => {
      const game = result.gameId;
      if (!game?._id || !result.publishDate) return;
      const displayDate = getDisawarDisplayDate(result.publishDate, game.nickName || game.name || '');
      map.set(`${getISTDateKey(displayDate)}:${game._id}`, result.publishedNumber);
    });
    return map;
  }, [results]);

  return (
    <section id="view-chart" className="scroll-mt-6 rounded-lg border border-[#7d6035]/55 bg-[linear-gradient(100deg,rgba(28,7,47,0.88),rgba(5,0,12,0.96),rgba(28,7,47,0.88))] p-5 shadow-[0_0_48px_rgba(92,43,151,0.24)]">
      <div className="mb-4 flex items-center justify-center gap-2">
        <CalendarDays className="h-5 w-5 text-[#ffe990]" />
        <h2 className="text-xl font-black uppercase text-[#ffe990]">View Chart</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <select aria-label="Chart year" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="h-12 rounded-md border border-[#7d6035]/55 bg-[#09020f] px-4 font-semibold text-white outline-none focus:border-[#ffe990]">
          {years.map(year => <option key={year} value={year}>{year}</option>)}
        </select>
        <select aria-label="Chart month" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="h-12 rounded-md border border-[#7d6035]/55 bg-[#09020f] px-4 font-semibold text-white outline-none focus:border-[#ffe990]">
          {MONTHS.map((month, index) => <option key={month} value={index}>{month}</option>)}
        </select>
        <button onClick={() => setChartPeriod({ year: selectedYear, month: selectedMonth })} className="flex h-12 items-center justify-center gap-2 rounded-md bg-[linear-gradient(100deg,#8f38da_0%,#db9a00_100%)] px-8 font-black text-white transition hover:brightness-110">
          <Search className="h-5 w-5" /> View Chart
        </button>
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border-2 border-[#7d6035]/60 bg-[#05000c] shadow-2xl">
        <div className="border-b border-[#7d6035]/45 px-4 py-4 sm:px-6">
          <h3 className="text-xl font-black text-[#ffe990] sm:text-2xl">View Chart</h3>
          <p className="mt-1 text-sm font-semibold text-white">{MONTHS[chartPeriod.month]} {chartPeriod.year}</p>
        </div>
        <div className="max-h-[70vh] overflow-auto">
          {loading ? <div className="p-12 text-center font-bold text-[#ffe990]">Loading chart...</div> : error ? <div className="p-12 text-center font-bold text-red-300">{error}</div> : (
            <table className="min-w-max w-full border-collapse text-center text-[9px] sm:text-sm">
              <thead className="sticky top-0 z-20 bg-amber-50 text-neutral-950">
                <tr>
                  <th className="sticky left-0 z-30 w-16 min-w-16 border border-amber-300 bg-amber-50 px-1 py-3 font-black sm:w-auto sm:min-w-32 sm:px-4 sm:py-4">DATE</th>
                  {visibleGames.map(game => <th key={game._id} className="w-16 min-w-16 max-w-16 break-words border border-neutral-300 px-1 py-3 font-black uppercase sm:w-auto sm:min-w-32 sm:max-w-none sm:px-4 sm:py-4">{game.nickName || game.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {days.map(day => {
                  const dateKey = `${chartPeriod.year}-${String(chartPeriod.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  return <tr key={day} className="hover:bg-white/5">
                    <th className="sticky left-0 z-10 border border-yellow-600/30 bg-amber-950 px-1 py-2.5 font-black text-yellow-100 sm:px-4 sm:py-3">{String(day).padStart(2, '0')}-{String(chartPeriod.month + 1).padStart(2, '0')}-{chartPeriod.year}</th>
                    {visibleGames.map(game => <td key={game._id} className="border border-white/20 px-1 py-2.5 text-[11px] font-bold text-white sm:px-4 sm:py-3 sm:text-base">{resultsMap.get(`${dateKey}:${game._id}`) || '-'}</td>)}
                  </tr>;
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}

export default PreviousViewChart;
