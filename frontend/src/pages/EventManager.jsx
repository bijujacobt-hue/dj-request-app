import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { getEvent, getEventRequests, closeEvent, deleteRequest, scanLibrary, matchRequest as matchRequestApi, getDJ, updateEvent, getEventContacts } from '../utils/api';
import { usePolling } from '../hooks/usePolling';
import { useToast } from '../components/Toast';
import DownloadManager from '../components/DownloadManager';
import FolderBrowser from '../components/FolderBrowser';

export default function EventManager() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [event, setEvent] = useState(null);
  const [dj, setDJ] = useState(null);
  const [requests, setRequests] = useState([]);
  const [matches, setMatches] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('requests');
  const [scanPath, setScanPath] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [footerText, setFooterText] = useState('');
  const [footerDirty, setFooterDirty] = useState(false);
  const [showScanBrowser, setShowScanBrowser] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactsLoaded, setContactsLoaded] = useState(false);
  const [sortBy, setSortBy] = useState('votes');
  const [filterText, setFilterText] = useState('');

  const eventLink = `${window.location.origin}/event/${eventId}`;

  useEffect(() => {
    async function init() {
      try {
        const eventData = await getEvent(eventId);
        setEvent(eventData);
        setFooterText(eventData.footer_text || '');
        const djData = await getDJ(eventData.dj_id);
        setDJ(djData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [eventId]);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await getEventRequests(eventId);
      setRequests(data);
    } catch {
      // silent
    }
  }, [eventId]);

  usePolling(fetchRequests, 5000, !!event);

  const handleClose = async () => {
    if (!confirm('Close this event? Guests will no longer be able to request songs.')) return;
    try {
      const updated = await closeEvent(eventId);
      setEvent(updated);
      toast('Event closed', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleDelete = async (requestId) => {
    try {
      await deleteRequest(requestId);
      fetchRequests();
      toast('Request removed', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!scanPath.trim() || !dj) return;
    setScanning(true);
    setScanResult(null);
    try {
      const result = await scanLibrary(dj.id, scanPath.trim());
      setScanResult(result);
      toast(`Scanned ${result.scanned} tracks`, 'success');
      fetchMatches();
    } catch (err) {
      setScanResult({ error: err.message });
      toast(err.message, 'error');
    } finally {
      setScanning(false);
    }
  };

  const fetchMatches = async () => {
    const newMatches = {};
    for (const req of requests) {
      try {
        const data = await matchRequestApi(req.id);
        if (data.matches && data.matches.length > 0) {
          newMatches[req.id] = data.matches[0];
        }
      } catch {
        // silent
      }
    }
    setMatches(newMatches);
  };

  useEffect(() => {
    if (requests.length > 0 && dj) {
      fetchMatches();
    }
  }, [requests.length, dj]);

  const handleTabChange = async (t) => {
    setTab(t);
    if (t === 'messages' && !contactsLoaded) {
      try {
        const data = await getEventContacts(eventId);
        setContacts(data);
        setContactsLoaded(true);
      } catch (err) {
        console.error('Failed to load contacts:', err);
      }
    }
  };

  const handleUpdateEvent = async (updates) => {
    try {
      const updated = await updateEvent(eventId, updates);
      setEvent(updated);
      return updated;
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleSaveFooter = async () => {
    await handleUpdateEvent({ footer_text: footerText });
    setFooterDirty(false);
    toast('Footer saved', 'success');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(eventLink);
    setCopiedLink(true);
    toast('Event link copied!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const exportCSV = () => {
    const header = 'Rank,Title,Artist,Votes,Voters,Source URL\n';
    const rows = requests.map((r, i) => {
      const voters = (r.voters || []).map(v => v.display_name).join('; ');
      const title = `"${(r.title || '').replace(/"/g, '""')}"`;
      const artist = `"${(r.artist || '').replace(/"/g, '""')}"`;
      return `${i + 1},${title},${artist},${r.vote_count},"${voters}",${r.source_url}`;
    }).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.name.replace(/[^a-zA-Z0-9]/g, '_')}_requests.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('CSV exported', 'success');
  };

  const filteredRequests = filterText.trim()
    ? requests.filter(r => {
        const q = filterText.toLowerCase();
        return (r.title || '').toLowerCase().includes(q)
          || (r.artist || '').toLowerCase().includes(q)
          || (r.voters || []).some(v => v.display_name.toLowerCase().includes(q));
      })
    : requests;

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    switch (sortBy) {
      case 'newest': return new Date(b.created_at) - new Date(a.created_at);
      case 'oldest': return new Date(a.created_at) - new Date(b.created_at);
      case 'title': return (a.title || '').localeCompare(b.title || '');
      case 'votes':
      default: return b.vote_count - a.vote_count;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-red-400">Event not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate('/dj')} className="text-slate-400 hover:text-white text-sm py-1">
            &larr; Dashboard
          </button>
          {event.is_active && (
            <button onClick={handleClose} className="text-red-400 hover:text-red-300 text-sm py-1">
              Close Event
            </button>
          )}
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{event.name}</h1>
            {!event.is_active && (
              <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded shrink-0">Closed</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            {event.event_date && <span>{event.event_date}</span>}
            <span>{filterText && sortedRequests.length !== requests.length
              ? `${sortedRequests.length} of ${requests.length} requests`
              : `${requests.length} requests`}</span>
            <button onClick={copyLink} className="text-purple-400 hover:text-purple-300">
              {copiedLink ? 'Copied!' : 'Copy link'}
            </button>
            <button onClick={() => setShowQR(!showQR)} className="text-purple-400 hover:text-purple-300">
              {showQR ? 'Hide QR' : 'QR Code'}
            </button>
            {requests.length > 0 && (
              <button onClick={exportCSV} className="text-purple-400 hover:text-purple-300">
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* QR Code modal */}
        {showQR && (
          <div className="mb-6 flex justify-center">
            <div className="bg-white p-4 rounded-xl inline-block">
              <QRCodeSVG value={eventLink} size={200} />
            </div>
          </div>
        )}

        {/* Footer text editor */}
        <div className="mb-6 bg-slate-800 rounded-xl p-3 border border-slate-700">
          <label className="text-xs text-slate-400 mb-1 block">Guest page footer message</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={footerText}
              onChange={(e) => { setFooterText(e.target.value); setFooterDirty(true); }}
              placeholder="e.g. Tips welcome via Venmo @djname"
              className="flex-1 bg-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {footerDirty && (
              <button
                onClick={handleSaveFooter}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium shrink-0"
              >
                Save
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-800 rounded-lg p-1 overflow-x-auto">
          {['requests', 'downloads', 'library', 'messages'].map(t => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={`flex-1 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                tab === t ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Requests tab */}
        {tab === 'requests' && (
          <div className="space-y-3">
            {requests.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Filter by song, artist, or name..."
                  className="flex-1 bg-slate-800 text-white px-3 py-2 rounded-lg text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-800 text-slate-300 px-3 py-2 rounded-lg text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="votes">Sort: Most Votes</option>
                  <option value="newest">Sort: Newest</option>
                  <option value="oldest">Sort: Oldest</option>
                  <option value="title">Sort: Title A-Z</option>
                </select>
              </div>
            )}
            {requests.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <p>No requests yet. Share the event link to get started!</p>
              </div>
            )}
            {filterText && sortedRequests.length === 0 && requests.length > 0 && (
              <div className="text-center py-8 text-slate-500">
                <p>No requests match your filter.</p>
              </div>
            )}
            {sortedRequests.map((req, index) => {
              const match = matches[req.id];
              return (
                <div key={req.id} className="bg-slate-800 rounded-xl p-3 sm:p-4 border border-slate-700">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-slate-600 text-sm font-mono w-7 text-right shrink-0 tabular-nums">{index + 1}</span>
                    {req.thumbnail_url && (
                      <a href={req.source_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                        <img src={req.thumbnail_url} alt="" className="w-12 h-9 sm:w-14 sm:h-10 object-cover rounded" />
                      </a>
                    )}
                    <div className="flex-1 min-w-0">
                      {req.source_url ? (
                        <a href={req.source_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white truncate block hover:text-purple-300 transition-colors">
                          {req.title}
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-white truncate">{req.title}</p>
                      )}
                      <p className="text-xs text-slate-400 truncate">{req.artist}</p>
                      <div className="flex flex-wrap items-center gap-x-2 mt-0.5">
                        <p className="text-xs text-slate-500">
                          {req.voters?.slice(0, 3).map(v => v.display_name).join(', ')}
                          {req.voters?.length > 3 && ` +${req.voters.length - 3} more`}
                        </p>
                        {match && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            match.confidence >= 80 ? 'bg-green-900/50 text-green-400' :
                            match.confidence >= 50 ? 'bg-yellow-900/50 text-yellow-400' :
                            'bg-slate-700 text-slate-400'
                          }`}>
                            {match.confidence}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-purple-400 font-medium text-sm">{req.vote_count}</span>
                      <button
                        onClick={() => handleDelete(req.id)}
                        className="text-slate-600 hover:text-red-400 text-lg p-1"
                        title="Remove request"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Downloads tab */}
        {tab === 'downloads' && (
          <DownloadManager requests={requests} eventId={eventId} event={event} onUpdateEvent={handleUpdateEvent} />
        )}

        {/* Library tab */}
        {tab === 'library' && (
          <div>
            <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-2 mb-4">
              <input
                type="text"
                value={scanPath}
                onChange={(e) => setScanPath(e.target.value)}
                placeholder="Music folder path (e.g. /Users/you/Music)"
                className="flex-1 bg-slate-700 text-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={() => setShowScanBrowser(true)}
                className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2.5 rounded-lg text-sm shrink-0"
              >
                Browse
              </button>
              <button
                type="submit"
                disabled={scanning}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 shrink-0"
              >
                {scanning ? 'Scanning...' : 'Scan'}
              </button>
            </form>

            {showScanBrowser && (
              <FolderBrowser
                initialPath={scanPath || undefined}
                onSelect={(path) => { setScanPath(path); setShowScanBrowser(false); }}
                onClose={() => setShowScanBrowser(false)}
              />
            )}

            {scanResult && (
              <div className={`rounded-lg p-3 mb-4 text-sm ${scanResult.error ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
                {scanResult.error
                  ? `Error: ${scanResult.error}`
                  : `Scan complete: ${scanResult.scanned} tracks found (${scanResult.errors} errors)`
                }
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-400">Library Matches</h3>
              {requests.length === 0 && (
                <p className="text-slate-600 text-sm">No requests to match against.</p>
              )}
              {requests.map(req => {
                const match = matches[req.id];
                return (
                  <div key={req.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                    <p className="text-sm text-white">{req.title}</p>
                    {match ? (
                      <div className="mt-1">
                        <p className="text-xs text-green-400">
                          {match.confidence}% - {match.reason}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{match.file_path}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 mt-1">No match found</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Messages tab */}
        {tab === 'messages' && (
          <div>
            {contacts.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <p>No messages yet</p>
                <p className="text-sm mt-1">Guests can leave messages after the event closes.</p>
              </div>
            )}
            <div className="space-y-3">
              {contacts.map(contact => (
                <div key={contact.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-white font-medium text-sm">{contact.guest_name}</span>
                    <span className="text-xs text-slate-600 shrink-0">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-purple-400 mb-1">{contact.contact_info}</p>
                  {contact.message && (
                    <p className="text-sm text-slate-300">{contact.message}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
