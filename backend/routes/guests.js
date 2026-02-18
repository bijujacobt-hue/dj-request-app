const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { generateId } = require('../utils/helpers');
const { generateName } = require('../services/nameGenerator');

// POST /api/guests - Create guest for event
router.post('/', (req, res) => {
  const { event_id } = req.body;

  if (!event_id) {
    return res.status(400).json({ error: 'event_id is required' });
  }

  const event = db.prepare('SELECT id, is_active FROM events WHERE id = ?').get(event_id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  if (!event.is_active) {
    return res.status(400).json({ error: 'Event is closed' });
  }

  const id = generateId('guest');
  const display_name = generateName();

  db.prepare(
    'INSERT INTO guests (id, event_id, display_name) VALUES (?, ?, ?)'
  ).run(id, event_id, display_name);

  const guest = db.prepare('SELECT * FROM guests WHERE id = ?').get(id);
  res.status(201).json(guest);
});

// GET /api/guests/:guestId - Get guest info
router.get('/:guestId', (req, res) => {
  const guest = db.prepare('SELECT * FROM guests WHERE id = ?').get(req.params.guestId);
  if (!guest) {
    return res.status(404).json({ error: 'Guest not found' });
  }
  res.json(guest);
});

// PUT /api/guests/:guestId/name - Update guest name
router.put('/:guestId/name', (req, res) => {
  const { display_name } = req.body;
  const { guestId } = req.params;

  if (!display_name || !display_name.trim()) {
    return res.status(400).json({ error: 'display_name is required' });
  }

  const guest = db.prepare('SELECT * FROM guests WHERE id = ?').get(guestId);
  if (!guest) {
    return res.status(404).json({ error: 'Guest not found' });
  }

  db.prepare('UPDATE guests SET display_name = ? WHERE id = ?').run(display_name.trim(), guestId);

  const updated = db.prepare('SELECT * FROM guests WHERE id = ?').get(guestId);
  res.json(updated);
});

module.exports = router;
