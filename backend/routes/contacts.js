const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { generateId } = require('../utils/helpers');

// POST /api/contacts - Submit contact form
router.post('/', (req, res) => {
  try {
    const { event_id, guest_name, contact_info, message } = req.body;

    if (!event_id || !guest_name?.trim() || !contact_info?.trim()) {
      return res.status(400).json({ error: 'event_id, guest_name, and contact_info are required' });
    }

    const event = db.prepare('SELECT id FROM events WHERE id = ?').get(event_id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const id = generateId('contact');
    db.prepare(
      'INSERT INTO contacts (id, event_id, guest_name, contact_info, message) VALUES (?, ?, ?, ?, ?)'
    ).run(id, event_id, guest_name.trim(), contact_info.trim(), message?.trim() || null);

    res.status(201).json({ message: 'Contact submitted', id });
  } catch (err) {
    console.error('Contact create error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contacts/event/:eventId - Get contacts for an event
router.get('/event/:eventId', (req, res) => {
  const contacts = db.prepare(
    'SELECT * FROM contacts WHERE event_id = ? ORDER BY created_at DESC'
  ).all(req.params.eventId);

  res.json(contacts);
});

module.exports = router;
