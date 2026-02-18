const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { generateId } = require('../utils/helpers');

// POST /api/events - Create new event
router.post('/', (req, res) => {
  const { dj_id, name, event_date, download_folder } = req.body;

  if (!dj_id || !name || !name.trim()) {
    return res.status(400).json({ error: 'dj_id and event name are required' });
  }

  const dj = db.prepare('SELECT id FROM djs WHERE id = ?').get(dj_id);
  if (!dj) {
    return res.status(404).json({ error: 'DJ not found' });
  }

  const id = generateId('evt');
  const stmt = db.prepare(
    'INSERT INTO events (id, dj_id, name, event_date, download_folder) VALUES (?, ?, ?, ?, ?)'
  );
  stmt.run(id, dj_id, name.trim(), event_date || null, download_folder || null);

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  res.status(201).json(event);
});

// GET /api/events/dj/:djId - Get all events for a DJ
router.get('/dj/:djId', (req, res) => {
  const events = db.prepare(`
    SELECT e.*,
      (SELECT COUNT(*) FROM requests r WHERE r.event_id = e.id) AS request_count,
      (SELECT COALESCE(SUM(r.vote_count), 0) FROM requests r WHERE r.event_id = e.id) AS total_votes
    FROM events e
    WHERE e.dj_id = ?
    ORDER BY e.created_at DESC
  `).all(req.params.djId);

  res.json(events);
});

// GET /api/events/:id - Get single event details
router.get('/:id', (req, res) => {
  const event = db.prepare(`
    SELECT e.*,
      (SELECT COUNT(*) FROM requests r WHERE r.event_id = e.id) AS request_count,
      (SELECT COALESCE(SUM(r.vote_count), 0) FROM requests r WHERE r.event_id = e.id) AS total_votes
    FROM events e
    WHERE e.id = ?
  `).get(req.params.id);

  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  res.json(event);
});

// PUT /api/events/:id/close - Close an event
router.put('/:id/close', (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  db.prepare(
    'UPDATE events SET is_active = 0, closed_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(req.params.id);

  const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// PUT /api/events/:id - Update event settings
router.put('/:id', (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const { footer_text, download_folder } = req.body;
  const updates = [];
  const params = [];

  if (footer_text !== undefined) {
    updates.push('footer_text = ?');
    params.push(footer_text || null);
  }
  if (download_folder !== undefined) {
    updates.push('download_folder = ?');
    params.push(download_folder || null);
  }

  if (updates.length > 0) {
    params.push(req.params.id);
    db.prepare(`UPDATE events SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/events/:id - Delete an event
router.delete('/:id', (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  res.json({ message: 'Event deleted', id: req.params.id });
});

module.exports = router;
