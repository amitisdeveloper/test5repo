import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminPresence } from '../hooks/useAdminPresence';

interface VisitorReportRow {
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  count: number;
}

const getCurrentMonth = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit'
  }).formatToParts(new Date());
  return `${parts.find((part) => part.type === 'year')?.value}-${parts.find((part) => part.type === 'month')?.value}`;
};

const getMonthRange = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { startDate: `${monthKey}-01`, endDate: `${monthKey}-${String(lastDay).padStart(2, '0')}` };
};

const moveMonth = (monthKey: string, amount: number) => {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + amount, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
};

function VisitorReportPage() {
  const navigate = useNavigate();
  useAdminPresence('visitor-report');
  const [report, setReport] = useState<VisitorReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const currentMonth = getCurrentMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const initialRange = getMonthRange(currentMonth);
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [appliedRange, setAppliedRange] = useState(initialRange);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setLoading(true);
    setError('');
    const params = new URLSearchParams({
      startDate: appliedRange.startDate,
      endDate: appliedRange.endDate,
      limit: '366'
    });
    fetch(`/api/visitors/report?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (response) => {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          navigate('/admin/login');
          return null;
        }
        if (!response.ok) throw new Error('Unable to load visitor report');
        return response.json();
      })
      .then((data) => {
        if (data) setReport(Array.isArray(data.report) ? data.report : []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load visitor report'))
      .finally(() => setLoading(false));
  }, [navigate, appliedRange]);

  const showMonth = (monthKey: string) => {
    const range = getMonthRange(monthKey);
    setSelectedMonth(monthKey);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setAppliedRange(range);
  };

  const applyDateRange = (event: React.FormEvent) => {
    event.preventDefault();
    if (!startDate || !endDate || startDate > endDate) {
      setError('Select a valid start and end date.');
      return;
    }
    setSelectedMonth('');
    setAppliedRange({ startDate, endDate });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-950 to-amber-950/30 text-white">
      <header className="border-b border-yellow-600/30 bg-black/80 shadow-lg">
        <div className="container mx-auto flex items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <Users className="h-7 w-7 text-yellow-400" aria-hidden="true" />
            <div>
              <h1 className="text-xl font-bold text-yellow-400">Daily Visitor Report</h1>
              <p className="text-xs text-gray-400">Reporting window: 10:00 AM to 10:00 AM IST</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gray-600 to-gray-700 px-4 py-2 font-medium hover:from-gray-700 hover:to-gray-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </button>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="mb-6 rounded-lg border border-yellow-600/30 bg-neutral-900 p-4 shadow-xl">
          <form onSubmit={applyDateRange} className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div>
                <label htmlFor="visitor-start-date" className="mb-1 block text-xs font-medium text-yellow-400">Start date</label>
                <input id="visitor-start-date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="rounded-lg border border-yellow-600/30 bg-black px-3 py-2 text-white" />
              </div>
              <div>
                <label htmlFor="visitor-end-date" className="mb-1 block text-xs font-medium text-yellow-400">End date</label>
                <input id="visitor-end-date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="rounded-lg border border-yellow-600/30 bg-black px-3 py-2 text-white" />
              </div>
              <button type="submit" className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-yellow-600 to-amber-700 px-4 py-2 font-medium text-black hover:from-yellow-500 hover:to-amber-600">
                <Search className="h-4 w-4" aria-hidden="true" /> Apply
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <button type="button" onClick={() => showMonth(moveMonth(selectedMonth || appliedRange.startDate.slice(0, 7), -1))} className="rounded-lg border border-yellow-600/30 p-2 hover:bg-amber-950/50" aria-label="Previous month">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => showMonth(currentMonth)} className="min-w-40 rounded-lg border border-yellow-600/30 px-4 py-2 font-medium text-yellow-400 hover:bg-amber-950/50">
                {selectedMonth
                  ? new Date(`${selectedMonth}-01T00:00:00Z`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' })
                  : 'Current Month'}
              </button>
              <button type="button" onClick={() => showMonth(moveMonth(selectedMonth || appliedRange.endDate.slice(0, 7), 1))} disabled={selectedMonth === currentMonth} className="rounded-lg border border-yellow-600/30 p-2 hover:bg-amber-950/50 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next month">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
        {error && <div className="mb-6 rounded-lg border border-red-600/30 bg-red-900/20 p-4 text-red-400">{error}</div>}
        <div className="overflow-hidden rounded-lg border border-yellow-600/30 bg-neutral-900 shadow-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-amber-950/60 text-yellow-400">
                <tr>
                  <th className="px-5 py-4 font-medium">Day</th>
                  <th className="px-5 py-4 font-medium">Time Window</th>
                  <th className="px-5 py-4 text-right font-medium">Visitors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-yellow-600/20 text-gray-200">
                {report.map((row) => (
                  <tr key={row.periodKey} className="hover:bg-amber-950/20">
                    <td className="whitespace-nowrap px-5 py-4">
                      {new Date(`${row.periodKey}T00:00:00+05:30`).toLocaleDateString('en-IN')}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-gray-400">10:00 AM – 10:00 AM next day</td>
                    <td className="px-5 py-4 text-right text-lg font-semibold text-yellow-400">
                      {Number(row.count).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
                {!loading && report.length === 0 && !error && (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-400">No visitor data available.</td></tr>
                )}
                {loading && (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-400">Loading visitor report...</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VisitorReportPage;
