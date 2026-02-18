const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { generateId } = require('../utils/helpers');

// POST /api/dj/create - Create new DJ profile
router.post('/create', (req, res) => {
  const { name, contact_email, contact_phone } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'DJ name is required' });
  }

  const id = generateId('dj');
  const stmt = db.prepare(
    'INSERT INTO djs (id, name, contact_email, contact_phone) VALUES (?, ?, ?, ?)'
  );
  stmt.run(id, name.trim(), contact_email || null, contact_phone || null);

  const dj = db.prepare('SELECT * FROM djs WHERE id = ?').get(id);
  res.status(201).json(dj);
});

// POST /api/dj/login - Login with DJ ID
router.post('/login', (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'DJ ID is required' });
  }

  const dj = db.prepare('SELECT * FROM djs WHERE id = ?').get(id);
  if (!dj) {
    return res.status(404).json({ error: 'DJ not found' });
  }

  res.json(dj);
});

// GET /api/dj/:id - Get DJ profile
router.get('/:id', (req, res) => {
  const dj = db.prepare('SELECT * FROM djs WHERE id = ?').get(req.params.id);
  if (!dj) {
    return res.status(404).json({ error: 'DJ not found' });
  }
  res.json(dj);
});

// PUT /api/dj/:id - Update DJ profile
router.put('/:id', (req, res) => {
  const { name, contact_email, contact_phone, library_paths } = req.body;
  const { id } = req.params;

  const existing = db.prepare('SELECT * FROM djs WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'DJ not found' });
  }

  const stmt = db.prepare(
    `UPDATE djs SET
      name = COALESCE(?, name),
      contact_email = COALESCE(?, contact_email),
      contact_phone = COALESCE(?, contact_phone),
      library_paths = COALESCE(?, library_paths)
    WHERE id = ?`
  );
  stmt.run(
    name || null,
    contact_email !== undefined ? contact_email : null,
    contact_phone !== undefined ? contact_phone : null,
    library_paths !== undefined ? (Array.isArray(library_paths) ? JSON.stringify(library_paths) : library_paths) : null,
    id
  );

  const updated = db.prepare('SELECT * FROM djs WHERE id = ?').get(id);
  res.json(updated);
});

module.exports = router;
