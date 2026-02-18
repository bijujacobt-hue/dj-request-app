import { useState, useEffect } from 'react';
import { browseDirectory } from '../utils/api';

export default function FolderBrowser({ onSelect, onClose, initialPath }) {
  const [current, setCurrent] = useState('');
  const [parent, setParent] = useState(null);
  const [directories, setDirectories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const browse = async (path) => {
    setLoading(true);
    setError(null);
    try {
      const data = await browseDirectory(path);
      setCurrent(data.current);
      setParent(data.parent);
      setDirectories(data.directories);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    browse(initialPath);
  }, [initialPath]);

  const breadcrumbs = current.split('/').filter(Boolean);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-white font-medium">Browse Folders</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">&times;</button>
        </div>

        {/* Breadcrumb */}
        <div className="px-4 py-2 border-b border-slate-700 overflow-x-auto">
          <div className="flex items-center gap-1 text-xs text-slate-400 whitespace-nowrap">
            <button onClick={() => browse('/')} className="hover:text-white">/</button>
            {breadcrumbs.map((part, i) => {
              const path = '/' + breadcrumbs.slice(0, i + 1).join('/');
              return (
                <span key={path} className="flex items-center gap-1">
                  <span className="text-slate-600">/</span>
                  <button onClick={() => browse(path)} className="hover:text-white">{part}</button>
                </span>
              );
            })}
          </div>
        </div>

        {/* Directory list */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading && <p className="text-slate-400 text-sm text-center py-4">Loading...</p>}
          {error && <p className="text-red-400 text-sm text-center py-4">{error}</p>}

          {!loading && !error && (
            <>
              {parent && (
                <button
                  onClick={() => browse(parent)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 text-left"
                >
                  <span className="text-slate-500">&#8593;</span>
                  <span>..</span>
                </button>
              )}
              {directories.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">No subdirectories</p>
              )}
              {directories.map(dir => (
                <button
                  key={dir.path}
                  onClick={() => browse(dir.path)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 text-left"
                >
                  <span className="text-yellow-400">&#128193;</span>
                  <span className="truncate">{dir.name}</span>
                </button>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <p className="text-xs text-slate-500 truncate mb-2">{current}</p>
          <button
            onClick={() => onSelect(current)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-medium"
          >
            Select This Folder
          </button>
        </div>
      </div>
    </div>
  );
}
