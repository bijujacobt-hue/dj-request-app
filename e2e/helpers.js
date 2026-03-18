/**
 * E2E test helpers — create test data via direct API calls
 * to avoid dependency on YouTube search for request creation.
 */

const API = 'http://localhost:3001/api';

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  return res.json();
}

export async function createTestDJ(name = 'Test DJ') {
  return apiRequest('/dj/create', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createTestEvent(djId, name = 'Test Event') {
  return apiRequest('/events', {
    method: 'POST',
    body: JSON.stringify({ dj_id: djId, name, event_date: '2026-04-01' }),
  });
}

export async function createTestGuest(eventId) {
  return apiRequest('/guests', {
    method: 'POST',
    body: JSON.stringify({ event_id: eventId }),
  });
}

export async function createTestRequest(eventId, guestId, title, artist) {
  return apiRequest('/requests', {
    method: 'POST',
    body: JSON.stringify({
      event_id: eventId,
      guest_id: guestId,
      title,
      artist,
      source: 'youtube',
      source_url: `https://youtube.com/watch?v=${Date.now()}`,
      thumbnail_url: 'https://i.ytimg.com/vi/test/default.jpg',
      duration_seconds: 240,
    }),
  });
}

export async function closeTestEvent(eventId) {
  return apiRequest(`/events/${eventId}/close`, { method: 'PUT' });
}
