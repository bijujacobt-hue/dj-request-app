const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const os = require('os');
const db = require('../database/db');
const { scanFolder } = require('../services/libraryScanner');
const { matchRequest } = require('../services/matcher');

// GET /api/library/browse - Browse directories for folder selection
router.get('/browse', (req, res) => {
  const requestedPath = req.query.path || os.homedir();
  const resolved = path.resolve(requestedPath);

  try {
    const entries = fs.readdirSync(resolved, { withFileTypes: true });
    const directories = entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.'))
      .map(e => ({
        name: e.name,
        path: path.join(resolved, e.name)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const parent = path.dirname(resolved);
    res.json({
      current: resolved,
      parent: parent !== resolved ? parent : null,
      directories
    });
  } catch (err) {
    if (err.code === 'EACCES') {
      return res.status(403).json({ error: 'Permission denied' });
    }
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'Directory not found' });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/library/scan - Scan folders
router.post('/scan', async (req, res) => {
  const { dj_id, folder_path } = req.body;

  if (!dj_id || !folder_path) {
    return res.status(400).json({ error: 'dj_id and folder_path are required' });
  }

  const dj = db.prepare('SELECT id FROM djs WHERE id = ?').get(dj_id);
  if (!dj) {
    return res.status(404).json({ error: 'DJ not found' });
  }

  try {
    const result = await scanFolder(dj_id, folder_path);
    res.json({
      message: 'Scan complete',
      ...result
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/library/dj/:djId - Get DJ's library
router.get('/dj/:djId', (req, res) => {
  const { search } = req.query;
  let tracks;

  if (search) {
    const pattern = `%${search}%`;
    tracks = db.prepare(`
      SELECT * FROM library
      WHERE dj_id = ? AND (title LIKE ? OR artist LIKE ? OR filename LIKE ?)
      ORDER BY artist, title
    `).all(req.params.djId, pattern, pattern, pattern);
  } else {
    tracks = db.prepare(
      'SELECT * FROM library WHERE dj_id = ? ORDER BY artist, title'
    ).all(req.params.djId);
  }

  res.json({ count: tracks.length, tracks });
});

// DELETE /api/library/dj/:djId - Clear library cache
router.delete('/dj/:djId', (req, res) => {
  const result = db.prepare('DELETE FROM library WHERE dj_id = ?').run(req.params.djId);
  res.json({ message: 'Library cleared', deleted: result.changes });
});

// GET /api/library/match/:requestId - Find matches for a request
router.get('/match/:requestId', (req, res) => {
  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.requestId);
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  // Get the DJ ID via the event
  const event = db.prepare('SELECT dj_id FROM events WHERE id = ?').get(request.event_id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const matches = matchRequest(event.dj_id, request.title, request.artist);

  res.json({
    request_id: request.id,
    title: request.title,
    artist: request.artist,
    matches
  });
});

module.exports = router;
