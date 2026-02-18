const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { generateId } = require('../utils/helpers');

// GET /api/requests/event/:eventId - Get all requests for event (sorted by votes)
router.get('/event/:eventId', (req, res) => {
  const event = db.prepare('SELECT id FROM events WHERE id = ?').get(req.params.eventId);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const requests = db.prepare(`
    SELECT r.* FROM requests r
    WHERE r.event_id = ?
    ORDER BY r.vote_count DESC, r.created_at ASC
  `).all(req.params.eventId);

  // Attach voters to each request
  const getVoters = db.prepare(`
    SELECT g.id AS guest_id, g.display_name
    FROM votes v
    JOIN guests g ON v.guest_id = g.id
    WHERE v.request_id = ?
    ORDER BY v.created_at ASC
  `);

  const result = requests.map(r => ({
    ...r,
    voters: getVoters.all(r.id)
  }));

  res.json(result);
});

// POST /api/requests - Create new request (with duplicate merging)
router.post('/', (req, res) => {
  const { event_id, guest_id, title, artist, source, source_url, thumbnail_url, duration_seconds } = req.body;

  if (!event_id || !guest_id || !title || !source || !source_url) {
    return res.status(400).json({ error: 'event_id, guest_id, title, source, and source_url are required' });
  }

  const event = db.prepare('SELECT id, is_active FROM events WHERE id = ?').get(event_id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  if (!event.is_active) {
    return res.status(400).json({ error: 'Event is closed' });
  }

  const guest = db.prepare('SELECT id FROM guests WHERE id = ?').get(guest_id);
  if (!guest) {
    return res.status(404).json({ error: 'Guest not found' });
  }

  // Check for duplicate: same source_url in the same event
  const existing = db.prepare(
    'SELECT * FROM requests WHERE event_id = ? AND source_url = ?'
  ).get(event_id, source_url);

  if (existing) {
    // Check if this guest already voted
    const alreadyVoted = db.prepare(
      'SELECT id FROM votes WHERE request_id = ? AND guest_id = ?'
    ).get(existing.id, guest_id);

    if (alreadyVoted) {
      return res.status(409).json({ error: 'You already requested/voted for this song', request: existing });
    }

    // Add vote for existing request
    const voteId = generateId('vote');
    db.prepare('INSERT INTO votes (id, request_id, guest_id) VALUES (?, ?, ?)').run(voteId, existing.id, guest_id);
    db.prepare('UPDATE requests SET vote_count = vote_count + 1 WHERE id = ?').run(existing.id);

    const updated = db.prepare('SELECT * FROM requests WHERE id = ?').get(existing.id);
    const voters = db.prepare(`
      SELECT g.id AS guest_id, g.display_name
      FROM votes v JOIN guests g ON v.guest_id = g.id
      WHERE v.request_id = ?
    `).all(existing.id);

    return res.json({ ...updated, voters, merged: true });
  }

  // Create new request
  const id = generateId('req');
  db.prepare(`
    INSERT INTO requests (id, event_id, title, artist, source, source_url, thumbnail_url, duration_seconds)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, event_id, title, artist || null, source, source_url, thumbnail_url || null, duration_seconds || null);

  // Create initial vote from the requester
  const voteId = generateId('vote');
  db.prepare('INSERT INTO votes (id, request_id, guest_id) VALUES (?, ?, ?)').run(voteId, id, guest_id);

  const created = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
  const voters = db.prepare(`
    SELECT g.id AS guest_id, g.display_name
    FROM votes v JOIN guests g ON v.guest_id = g.id
    WHERE v.request_id = ?
  `).all(id);

  res.status(201).json({ ...created, voters });
});

// DELETE /api/requests/:id/guest/:guestId - Guest delete own request (sole voter only)
router.delete('/:id/guest/:guestId', (req, res) => {
  const { id, guestId } = req.params;

  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  // Verify this guest is the sole voter
  const voters = db.prepare('SELECT guest_id FROM votes WHERE request_id = ?').all(id);
  if (voters.length !== 1 || voters[0].guest_id !== guestId) {
    return res.status(403).json({ error: 'You can only delete requests where you are the sole voter' });
  }

  db.prepare('DELETE FROM requests WHERE id = ?').run(id);
  res.json({ message: 'Request deleted', id });
});

// DELETE /api/requests/:id - Remove request
router.delete('/:id', (req, res) => {
  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id);
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  db.prepare('DELETE FROM requests WHERE id = ?').run(req.params.id);
  res.json({ message: 'Request deleted', id: req.params.id });
});

// POST /api/votes - Add vote to request
router.post('/votes', (req, res) => {
  const { request_id, guest_id } = req.body;

  if (!request_id || !guest_id) {
    return res.status(400).json({ error: 'request_id and guest_id are required' });
  }

  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(request_id);
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  const guest = db.prepare('SELECT id FROM guests WHERE id = ?').get(guest_id);
  if (!guest) {
    return res.status(404).json({ error: 'Guest not found' });
  }

  const alreadyVoted = db.prepare(
    'SELECT id FROM votes WHERE request_id = ? AND guest_id = ?'
  ).get(request_id, guest_id);
  if (alreadyVoted) {
    return res.status(409).json({ error: 'Already voted for this request' });
  }

  const voteId = generateId('vote');
  db.prepare('INSERT INTO votes (id, request_id, guest_id) VALUES (?, ?, ?)').run(voteId, request_id, guest_id);
  db.prepare('UPDATE requests SET vote_count = vote_count + 1 WHERE id = ?').run(request_id);

  const updated = db.prepare('SELECT * FROM requests WHERE id = ?').get(request_id);
  res.json(updated);
});

// DELETE /api/votes/:requestId/:guestId - Remove vote
router.delete('/votes/:requestId/:guestId', (req, res) => {
  const { requestId, guestId } = req.params;

  const vote = db.prepare(
    'SELECT id FROM votes WHERE request_id = ? AND guest_id = ?'
  ).get(requestId, guestId);
  if (!vote) {
    return res.status(404).json({ error: 'Vote not found' });
  }

  db.prepare('DELETE FROM votes WHERE id = ?').run(vote.id);
  db.prepare('UPDATE requests SET vote_count = vote_count - 1 WHERE id = ?').run(requestId);

  const updated = db.prepare('SELECT * FROM requests WHERE id = ?').get(requestId);
  res.json(updated);
});

module.exports = router;
