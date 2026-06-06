import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface Game {
  _id: string;
  name?: string;
  nickName?: string;
  resultTime?: string | null;
}

interface BulkRow {
  lineNumber: number;
  date: string;
  publishedNumber: string;
}

interface ParsedBulkInput {
  rows: BulkRow[];
  errors: string[];
}

const PLACEHOLDER_RESULTS = new Set(['--', '##', 'wait']);

interface BulkPublishResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    gameId: string;
    mode: 'skip' | 'overwrite';
    rows: BulkRow[];
  }) => Promise<void>;
  loading?: boolean;
  error?: string;
}

const EXAMPLE_ROWS = `2025-04-17,34
2025-04-18,56
2025-04-19,78`;

function parseBulkInput(input: string): ParsedBulkInput {
  const rows: BulkRow[] = [];
  const errors: string[] = [];
  const lines = input.split(/\r?\n/);

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      return;
    }

    const parts = trimmedLine
      .split(/[,\t|;]/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length < 2) {
      errors.push(`Line ${index + 1}: use "YYYY-MM-DD,NUMBER"`);
      return;
    }

    const [date, ...numberParts] = parts;
    const publishedNumber = numberParts.join(',').trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push(`Line ${index + 1}: date must be in YYYY-MM-DD format`);
      return;
    }

    if (isNaN(new Date(date).getTime())) {
      errors.push(`Line ${index + 1}: invalid date`);
      return;
    }

    if (!publishedNumber) {
      errors.push(`Line ${index + 1}: published number is required`);
      return;
    }

    if (PLACEHOLDER_RESULTS.has(publishedNumber.toLowerCase())) {
      errors.push(`Line ${index + 1}: placeholder results are not allowed`);
      return;
    }

    rows.push({
      lineNumber: index + 1,
      date,
      publishedNumber
    });
  });

  return { rows, errors };
}

function BulkPublishResultsModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  error
}: BulkPublishResultsModalProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    gameId: '',
    mode: 'skip' as 'skip' | 'overwrite',
    bulkText: ''
  });

  const API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';
  const parsedInput = parseBulkInput(formData.bulkText);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormError('');
    fetchGames();
  }, [isOpen]);

  const fetchGames = async () => {
    try {
      setLoadingGames(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/games/admin/active-games`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }

      const data = await response.json();
      setGames(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      console.error('Error fetching games:', fetchError);
      setFormError('Failed to load games');
    } finally {
      setLoadingGames(false);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
    setFormError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');

    if (!formData.gameId) {
      setFormError('Please select a game');
      return;
    }

    if (parsedInput.rows.length === 0) {
      setFormError('Add at least one valid row before importing');
      return;
    }

    if (parsedInput.errors.length > 0) {
      setFormError('Fix the invalid rows before importing');
      return;
    }

    try {
      await onSubmit({
        gameId: formData.gameId,
        mode: formData.mode,
        rows: parsedInput.rows
      });

      setFormData({
        gameId: '',
        mode: 'skip',
        bulkText: ''
      });
    } catch (submitError: any) {
      setFormError(submitError.message || 'Failed to import results');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-5">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bulk Import Results</h2>
            <p className="mt-1 text-sm text-gray-500">Paste one date and result per line for a single game.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          {(formError || error) && (
            <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError || error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Select Game</label>
              <select
                name="gameId"
                value={formData.gameId}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                disabled={loading || loadingGames}
              >
                <option value="">-- Choose a game --</option>
                {games.map((game) => (
                  <option key={game._id} value={game._id}>
                    {`${game.name || game.nickName}${game.resultTime ? ` (${game.resultTime})` : ''}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Existing Dates</label>
              <select
                name="mode"
                value={formData.mode}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                disabled={loading}
              >
                <option value="skip">Skip existing dates</option>
                <option value="overwrite">Overwrite existing dates</option>
              </select>
            </div>
          </div>

          <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <p className="font-semibold">Input format</p>
            <p className="mt-1">Use one line per result in `YYYY-MM-DD,NUMBER` format.</p>
            <pre className="mt-3 overflow-x-auto rounded bg-white p-3 text-xs text-gray-700">{EXAMPLE_ROWS}</pre>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Rows</label>
            <textarea
              name="bulkText"
              value={formData.bulkText}
              onChange={handleChange}
              rows={12}
              placeholder={EXAMPLE_ROWS}
              className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-800">Preview</p>
              <p className="mt-2 text-sm text-gray-600">Valid rows: {parsedInput.rows.length}</p>
              <p className="text-sm text-gray-600">Issues: {parsedInput.errors.length}</p>
              {parsedInput.rows.length > 0 && (
                <div className="mt-3 max-h-40 overflow-y-auto rounded border border-gray-200 bg-white">
                  {parsedInput.rows.slice(0, 8).map((row) => (
                    <div key={`${row.lineNumber}-${row.date}`} className="flex justify-between border-b border-gray-100 px-3 py-2 text-sm last:border-b-0">
                      <span className="text-gray-700">{row.date}</span>
                      <span className="font-semibold text-gray-900">{row.publishedNumber}</span>
                    </div>
                  ))}
                  {parsedInput.rows.length > 8 && (
                    <div className="px-3 py-2 text-xs text-gray-500">
                      +{parsedInput.rows.length - 8} more rows
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-800">Validation</p>
              {parsedInput.errors.length === 0 ? (
                <p className="mt-2 text-sm text-green-700">No parsing issues found.</p>
              ) : (
                <div className="mt-2 max-h-40 overflow-y-auto rounded border border-red-200 bg-white">
                  {parsedInput.errors.slice(0, 8).map((validationError) => (
                    <div key={validationError} className="border-b border-red-100 px-3 py-2 text-sm text-red-700 last:border-b-0">
                      {validationError}
                    </div>
                  ))}
                  {parsedInput.errors.length > 8 && (
                    <div className="px-3 py-2 text-xs text-red-600">
                      +{parsedInput.errors.length - 8} more issues
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={loading || loadingGames}
            >
              {loading ? 'Importing...' : 'Import Results'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BulkPublishResultsModal;
