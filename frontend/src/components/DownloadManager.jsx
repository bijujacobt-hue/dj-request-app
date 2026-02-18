import { useState, useEffect, useRef } from 'react';
import { startDownload, getDownloadProgress, batchDownload } from '../utils/api';
import FolderBrowser from './FolderBrowser';

function ProgressBar({ requestId, onComplete }) {
  const [progress, setProgress] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const data = await getDownloadProgress(requestId);
        setProgress(data);
        if (data.status === 'complete' || data.status === 'error') {
          clearInterval(intervalRef.current);
          if (data.status === 'complete' && onComplete) onComplete(data);
        }
      } catch {
        // silent
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 1000);
    return () => clearInterval(intervalRef.current);
  }, [requestId]);

  if (!progress) return null;

  const isError = progress.status === 'error';
  const isComplete = progress.status === 'complete';
  const isLowQuality = isComplete && progress.bitrate && progress.bitrate < 192;

  return (
    <div className="mt-2">
      <div className="w-full bg-slate-700 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${isError ? 'bg-red-500' : isComplete ? 'bg-green-500' : 'bg-purple-500'}`}
          style={{ width: `${progress.progress || 0}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className={`text-xs ${isError ? 'text-red-400' : isComplete ? 'text-green-400' : 'text-slate-400'}`}>
          {isError ? 'Failed' : isComplete ? 'Downloaded' : `${Math.round(progress.progress || 0)}%`}
          {progress.speed && !isComplete && ` - ${progress.speed}`}
        </span>
        {isComplete && progress.bitrate && (
          <span className={`text-xs ${isLowQuality ? 'text-yellow-400' : 'text-slate-500'}`}>
            {progress.bitrate}kbps{isLowQuality ? ' (low quality)' : ''}
          </span>
        )}
      </div>
    </div>
  );
}

export default function DownloadManager({ requests, eventId, event, onUpdateEvent }) {
  const [downloading, setDownloading] = useState(new Set());
  const [completed, setCompleted] = useState(new Set());
  const [selected, setSelected] = useState(new Set());
  const [folderPath, setFolderPath] = useState(event?.download_folder || '');
  const [folderDirty, setFolderDirty] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);

  // Check initial download status
  useEffect(() => {
    async function checkStatus() {
      const done = new Set();
      for (const req of requests) {
        try {
          const status = await getDownloadProgress(req.id);
          if (status.status === 'complete') done.add(req.id);
        } catch {
          // ignore
        }
      }
      setCompleted(done);
    }
    if (requests.length > 0) checkStatus();
  }, [requests]);

  const handleSaveFolder = async () => {
    if (onUpdateEvent) {
      await onUpdateEvent({ download_folder: folderPath });
      setFolderDirty(false);
    }
  };

  const outputDir = folderPath || undefined;

  const handleDownload = async (requestId) => {
    setDownloading(prev => new Set(prev).add(requestId));
    try {
      await startDownload(requestId, outputDir);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleBatchDownload = async () => {
    const ids = selected.size > 0
      ? [...selected].filter(id => !completed.has(id) && !downloading.has(id))
      : requests.map(r => r.id).filter(id => !completed.has(id) && !downloading.has(id));

    if (ids.length === 0) return;

    ids.forEach(id => setDownloading(prev => new Set(prev).add(id)));
    try {
      await batchDownload(ids, outputDir);
    } catch (err) {
      console.error('Batch download failed:', err);
    }
  };

  const handleComplete = (requestId) => {
    setCompleted(prev => new Set(prev).add(requestId));
    setDownloading(prev => {
      const next = new Set(prev);
      next.delete(requestId);
      return next;
    });
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const missingCount = requests.filter(r => !completed.has(r.id)).length;

  return (
    <div>
      {/* Download folder */}
      <div className="mb-4 bg-slate-800 rounded-xl p-3 border border-slate-700">
        <label className="text-xs text-slate-400 mb-1 block">Download folder</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={folderPath}
            onChange={(e) => { setFolderPath(e.target.value); setFolderDirty(true); }}
            placeholder="Default: ~/Downloads"
            className="flex-1 bg-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={() => setShowBrowser(true)}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded-lg text-sm shrink-0"
          >
            Browse
          </button>
          {folderDirty && (
            <button
              onClick={handleSaveFolder}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium shrink-0"
            >
              Save
            </button>
          )}
        </div>
      </div>

      {showBrowser && (
        <FolderBrowser
          initialPath={folderPath || undefined}
          onSelect={(path) => { setFolderPath(path); setFolderDirty(true); setShowBrowser(false); }}
          onClose={() => setShowBrowser(false)}
        />
      )}

      {/* Batch controls */}
      {requests.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <span className="text-sm text-slate-400">
            {completed.size} / {requests.length} downloaded
          </span>
          {missingCount > 0 && (
            <button
              onClick={handleBatchDownload}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium w-full sm:w-auto"
            >
              {selected.size > 0 ? `Download Selected (${selected.size})` : `Download All Missing (${missingCount})`}
            </button>
          )}
        </div>
      )}

      {/* Request list with download controls */}
      <div className="space-y-3">
        {requests.map((request) => {
          const isDownloading = downloading.has(request.id);
          const isCompleted = completed.has(request.id);
          const isSelected = selected.has(request.id);

          return (
            <div key={request.id} className="bg-slate-800 rounded-xl p-3 sm:p-4 border border-slate-700">
              <div className="flex items-center gap-2 sm:gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(request.id)}
                  className="shrink-0 accent-purple-500 w-4 h-4"
                />
                {request.thumbnail_url && (
                  <img src={request.thumbnail_url} alt="" className="w-10 h-7 sm:w-12 sm:h-9 object-cover rounded shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{request.title}</p>
                  <p className="text-xs text-slate-400 truncate">{request.artist}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs sm:text-sm text-purple-400 font-medium">{request.vote_count}</span>
                  {!isCompleted && !isDownloading && (
                    <button
                      onClick={() => handleDownload(request.id)}
                      className="bg-slate-700 hover:bg-slate-600 text-white px-2 sm:px-3 py-1.5 rounded-lg text-xs"
                    >
                      DL
                    </button>
                  )}
                  {isCompleted && (
                    <span className="text-green-400 text-xs">Done</span>
                  )}
                </div>
              </div>
              {(isDownloading || isCompleted) && (
                <ProgressBar
                  requestId={request.id}
                  onComplete={() => handleComplete(request.id)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
