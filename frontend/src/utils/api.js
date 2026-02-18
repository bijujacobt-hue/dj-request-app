const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// DJ
export const createDJ = (body) => request('/dj/create', { method: 'POST', body: JSON.stringify(body) });
export const loginDJ = (id) => request('/dj/login', { method: 'POST', body: JSON.stringify({ id }) });
export const getDJ = (id) => request(`/dj/${id}`);
export const updateDJ = (id, body) => request(`/dj/${id}`, { method: 'PUT', body: JSON.stringify(body) });

// Events
export const createEvent = (body) => request('/events', { method: 'POST', body: JSON.stringify(body) });
export const getDJEvents = (djId) => request(`/events/dj/${djId}`);
export const getEvent = (id) => request(`/events/${id}`);
export const closeEvent = (id) => request(`/events/${id}/close`, { method: 'PUT' });
export const updateEvent = (id, body) => request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteEvent = (id) => request(`/events/${id}`, { method: 'DELETE' });

// Guests
export const createGuest = (eventId) => request('/guests', { method: 'POST', body: JSON.stringify({ event_id: eventId }) });
export const getGuest = (guestId) => request(`/guests/${guestId}`);
export const updateGuestName = (guestId, name) => request(`/guests/${guestId}/name`, { method: 'PUT', body: JSON.stringify({ display_name: name }) });

// Requests
export const getEventRequests = (eventId) => request(`/requests/event/${eventId}`);
export const createRequest = (body) => request('/requests', { method: 'POST', body: JSON.stringify(body) });
export const deleteRequest = (id) => request(`/requests/${id}`, { method: 'DELETE' });
export const deleteOwnRequest = (requestId, guestId) => request(`/requests/${requestId}/guest/${guestId}`, { method: 'DELETE' });

// Votes
export const addVote = (requestId, guestId) => request('/requests/votes', { method: 'POST', body: JSON.stringify({ request_id: requestId, guest_id: guestId }) });
export const removeVote = (requestId, guestId) => request(`/requests/votes/${requestId}/${guestId}`, { method: 'DELETE' });

// Search
export const searchYouTube = (query) => request(`/search/youtube?q=${encodeURIComponent(query)}`);

// Library
export const browseDirectory = (path) => request(`/library/browse${path ? `?path=${encodeURIComponent(path)}` : ''}`);
export const scanLibrary = (djId, folderPath) => request('/library/scan', { method: 'POST', body: JSON.stringify({ dj_id: djId, folder_path: folderPath }) });
export const getDJLibrary = (djId, search) => request(`/library/dj/${djId}${search ? `?search=${encodeURIComponent(search)}` : ''}`);
export const matchRequest = (requestId) => request(`/library/match/${requestId}`);

// Contacts
export const getEventContacts = (eventId) => request(`/contacts/event/${eventId}`);

// Downloads
export const startDownload = (requestId, outputDir) => request(`/downloads/start/${requestId}`, { method: 'POST', body: JSON.stringify({ output_dir: outputDir }) });
export const getDownloadProgress = (requestId) => request(`/downloads/progress/${requestId}`);
export const cancelDownload = (requestId) => request(`/downloads/cancel/${requestId}`, { method: 'POST' });
export const batchDownload = (requestIds, outputDir) => request('/downloads/batch', { method: 'POST', body: JSON.stringify({ request_ids: requestIds, output_dir: outputDir }) });
