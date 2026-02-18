import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDJ, loginDJ, getDJEvents, createEvent } from '../utils/api';

const DJ_ID_KEY = 'dj_id';

export default function DJDashboard() {
  const navigate = useNavigate();
  const [dj, setDJ] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [createForm, setCreateForm] = useState({ name: '', contact_email: '' });
  const [eventForm, setEventForm] = useState({ name: '', event_date: '' });
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const savedId = localStorage.getItem(DJ_ID_KEY);
    if (savedId) {
      loadDJ(savedId);
    } else {
      setLoading(false);
    }
  }, []);

  async function loadDJ(id) {
    try {
      const djData = await loginDJ(id);
      setDJ(djData);
      localStorage.setItem(DJ_ID_KEY, djData.id);
      const eventsData = await getDJEvents(djData.id);
      setEvents(eventsData);
    } catch (err) {
      localStorage.removeItem(DJ_ID_KEY);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    try {
      await loadDJ(loginId.trim());
    } catch (err) {
      setError('DJ ID not found');
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      const djData = await createDJ(createForm);
      setDJ(djData);
      localStorage.setItem(DJ_ID_KEY, djData.id);
      setEvents([]);
      setShowCreate(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateEvent(e) {
    e.preventDefault();
    setError('');
    try {
      await createEvent({ dj_id: dj.id, ...eventForm });
      const eventsData = await getDJEvents(dj.id);
      setEvents(eventsData);
      setEventForm({ name: '', event_date: '' });
      setShowNewEvent(false);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleLogout() {
    localStorage.removeItem(DJ_ID_KEY);
    setDJ(null);
    setEvents([]);
    setShowLogin(false);
    setShowCreate(false);
  }

  function copyEventLink(eventId) {
    const link = `${window.location.origin}/event/${eventId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(eventId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  // Not logged in
  if (!dj) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-sm w-full">
          <h1 className="text-3xl font-bold text-white text-center mb-8">DJ Dashboard</h1>

          {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

          {!showLogin && !showCreate && (
            <div className="space-y-3">
              <button
                onClick={() => setShowLogin(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium"
              >
                Login with DJ ID
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium"
              >
                Create New DJ Profile
              </button>
            </div>
          )}

          {showLogin && (
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Enter your DJ ID (e.g. dj_abc123)"
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium">
                  Login
                </button>
                <button type="button" onClick={() => { setShowLogin(false); setError(''); }} className="px-4 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl">
                  Back
                </button>
              </div>
            </form>
          )}

          {showCreate && (
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Your DJ name"
                required
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
              <input
                type="email"
                value={createForm.contact_email}
                onChange={(e) => setCreateForm({ ...createForm, contact_email: e.target.value })}
                placeholder="Email (optional)"
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium">
                  Create Profile
                </button>
                <button type="button" onClick={() => { setShowCreate(false); setError(''); }} className="px-4 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl">
                  Back
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Logged in dashboard
  const activeEvents = events.filter(e => e.is_active);
  const closedEvents = events.filter(e => !e.is_active);

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">{dj.name}</h1>
            <p className="text-slate-500 text-xs font-mono mt-1">ID: {dj.id}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-white text-sm"
          >
            Logout
          </button>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {/* Create event */}
        <div className="mb-8">
          {!showNewEvent ? (
            <button
              onClick={() => setShowNewEvent(true)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium"
            >
              + Create New Event
            </button>
          ) : (
            <form onSubmit={handleCreateEvent} className="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-3">
              <input
                type="text"
                value={eventForm.name}
                onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                placeholder="Event name (e.g. Sarah's Birthday Party)"
                required
                className="w-full bg-slate-700 text-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
              <input
                type="date"
                value={eventForm.event_date}
                onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                className="w-full bg-slate-700 text-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg text-sm font-medium">
                  Create Event
                </button>
                <button type="button" onClick={() => setShowNewEvent(false)} className="px-4 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg text-sm">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Active events */}
        {activeEvents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-3">Active Events</h2>
            <div className="space-y-3">
              {activeEvents.map(event => (
                <div key={event.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-start sm:items-center justify-between gap-2 mb-2">
                    <h3 className="font-medium text-white truncate">{event.name}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => copyEventLink(event.id)}
                        className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg"
                      >
                        {copiedId === event.id ? 'Copied!' : 'Copy Link'}
                      </button>
                      <button
                        onClick={() => navigate(`/dj/event/${event.id}`)}
                        className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    {event.event_date && <span>{event.event_date}</span>}
                    <span>{event.request_count} requests</span>
                    <span>{event.total_votes} votes</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Closed events */}
        {closedEvents.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-400 mb-3">Closed Events</h2>
            <div className="space-y-3">
              {closedEvents.map(event => (
                <div key={event.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-slate-400">{event.name}</h3>
                    <button
                      onClick={() => navigate(`/dj/event/${event.id}`)}
                      className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg"
                    >
                      View
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    {event.event_date && <span>{event.event_date}</span>}
                    <span>{event.request_count} requests</span>
                    <span>{event.total_votes} votes</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {events.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p className="text-lg">No events yet</p>
            <p className="text-sm mt-1">Create your first event to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
