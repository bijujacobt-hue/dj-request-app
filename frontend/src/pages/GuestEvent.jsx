import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getEvent, createGuest, getGuest, getEventRequests, createRequest, deleteOwnRequest } from '../utils/api';
import { usePolling } from '../hooks/usePolling';
import { useToast } from '../components/Toast';
import NamePicker from '../components/NamePicker';
import SearchBar from '../components/SearchBar';
import RequestList from '../components/RequestList';
import EventClosed from './EventClosed';

const COOKIE_PREFIX = 'guestId_';

function getGuestCookie(eventId) {
  const match = document.cookie.split('; ').find(c => c.startsWith(`${COOKIE_PREFIX}${eventId}=`));
  return match ? match.split('=')[1] : null;
}

function setGuestCookie(eventId, guestId) {
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  document.cookie = `${COOKIE_PREFIX}${eventId}=${guestId}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export default function GuestEvent() {
  const { eventId } = useParams();
  const toast = useToast();
  const [event, setEvent] = useState(null);
  const [guest, setGuest] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize event and guest
  useEffect(() => {
    async function init() {
      try {
        const eventData = await getEvent(eventId);
        setEvent(eventData);

        // Check for existing guest cookie
        const savedGuestId = getGuestCookie(eventId);
        if (savedGuestId) {
          try {
            const guestData = await getGuest(savedGuestId);
            setGuest(guestData);
          } catch {
            // Guest not found, create new one
            if (eventData.is_active) {
              const newGuest = await createGuest(eventId);
              setGuest(newGuest);
              setGuestCookie(eventId, newGuest.id);
            }
          }
        } else if (eventData.is_active) {
          const newGuest = await createGuest(eventId);
          setGuest(newGuest);
          setGuestCookie(eventId, newGuest.id);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [eventId]);

  // Poll for request updates
  const fetchRequests = useCallback(async () => {
    try {
      const data = await getEventRequests(eventId);
      setRequests(data);
    } catch {
      // silent fail on poll
    }
  }, [eventId]);

  usePolling(fetchRequests, 5000, !!event && event.is_active);

  const handleDeleteRequest = async (requestId) => {
    if (!guest) return;
    try {
      await deleteOwnRequest(requestId, guest.id);
      toast('Request removed', 'success');
      fetchRequests();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleSongSelect = async (result) => {
    if (!guest) return;
    try {
      const data = await createRequest({
        event_id: eventId,
        guest_id: guest.id,
        title: result.title,
        artist: result.artist,
        source: result.source,
        source_url: result.url,
        thumbnail_url: result.thumbnail,
        duration_seconds: result.duration
      });
      if (data.merged) {
        toast('Vote added to existing request!', 'success');
      } else {
        toast('Song requested!', 'success');
      }
      fetchRequests();
    } catch (err) {
      if (err.message.includes('already')) {
        toast('You already voted for this song', 'info');
      } else {
        toast(err.message, 'error');
      }
      fetchRequests();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen ghibli-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-slate-400">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen ghibli-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">Event not found</p>
          <p className="text-slate-500 text-sm mt-2">This event link may be invalid.</p>
        </div>
      </div>
    );
  }

  if (event && !event.is_active) {
    return <EventClosed event={event} />;
  }

  return (
    <div className="min-h-screen ghibli-bg safe-bottom">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">{event.name}</h1>
          {event.event_date && (
            <p className="text-slate-500 text-sm mt-1">{event.event_date}</p>
          )}
        </div>

        {/* Guest name */}
        {guest && (
          <div className="flex justify-center mb-6">
            <NamePicker
              guest={guest}
              onNameUpdated={(updated) => setGuest(updated)}
            />
          </div>
        )}

        {/* Search */}
        <div className="mb-8">
          <SearchBar onSelect={handleSongSelect} />
        </div>

        {/* Request list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Requests
              {requests.length > 0 && (
                <span className="text-slate-500 font-normal text-sm ml-2">
                  ({requests.length})
                </span>
              )}
            </h2>
          </div>
          <RequestList
            requests={requests}
            guestId={guest?.id}
            onVoteChanged={fetchRequests}
            onDelete={handleDeleteRequest}
          />
        </div>

        {/* Footer */}
        {event.footer_text && (
          <div className="mt-8 pt-4 border-t border-slate-700">
            <p className="text-sm text-slate-400 text-center">{event.footer_text}</p>
          </div>
        )}
      </div>
    </div>
  );
}
