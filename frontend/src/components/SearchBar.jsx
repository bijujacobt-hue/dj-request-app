import { useState, useRef } from 'react';
import { searchYouTube } from '../utils/api';

export default function SearchBar({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const timeoutRef = useRef(null);

  const handleSearch = async (q) => {
    if (!q.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    setLoading(true);
    try {
      const data = await searchYouTube(q);
      setResults(data.results || []);
      setShowResults(true);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => handleSearch(value), 500);
  };

  const handleSelect = (result) => {
    onSelect(result);
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Smart song search (YouTube, SoundCloud)"
          className="flex-1 bg-slate-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-400"
        />
        <button
          onClick={() => handleSearch(query)}
          disabled={loading || !query.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-5 py-3 rounded-xl text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 max-h-96 overflow-y-auto">
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className="w-full flex items-center gap-3 p-3 hover:bg-slate-700 transition-colors text-left first:rounded-t-xl last:rounded-b-xl"
            >
              <img
                src={result.thumbnail}
                alt=""
                className="w-16 h-12 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{result.title}</p>
                <p className="text-xs text-slate-400">{result.artist}</p>
              </div>
              {result.duration && (
                <span className="text-xs text-slate-500 shrink-0">
                  {formatDuration(result.duration)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && !loading && query.trim() && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 rounded-xl p-4 text-center text-slate-400 text-sm border border-slate-700">
          No results found
        </div>
      )}
    </div>
  );
}
