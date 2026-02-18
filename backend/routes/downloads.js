const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../database/db');
const { startDownload, getProgress, cancelDownload } = require('../services/downloader');

// POST /api/downloads/start/:requestId - Start download
router.post('/start/:requestId', async (req, res) => {
  const { requestId } = req.params;
  const { output_dir } = req.body;

  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(requestId);
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  // Determine output directory
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(request.event_id);
  let outputDir = output_dir;
  if (!outputDir) {
    if (event && event.download_folder) {
      outputDir = event.download_folder;
    } else {
      // Default: ~/Music/DJ_Events/EventName/
      const safeName = event.name.replace(/[^a-zA-Z0-9]/g, '_');
      outputDir = path.join(
        process.env.HOME || '/tmp',
        'Music', 'DJ_Events',
        `${event.event_date || 'undated'}_${safeName}`,
        'downloaded'
      );
    }
  }

  try {
    // Start download asynchronously, respond immediately
    res.json({
      message: 'Download started',
      requestId,
      outputDir,
      status: 'downloading'
    });

    // Run download in background
    startDownload(requestId, outputDir).catch(err => {
      console.error(`Download failed for ${requestId}:`, err.message);
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/downloads/progress/:requestId - Get progress
router.get('/progress/:requestId', (req, res) => {
  const progress = getProgress(req.params.requestId);
  res.json(progress);
});

// POST /api/downloads/cancel/:requestId - Cancel download
router.post('/cancel/:requestId', (req, res) => {
  const cancelled = cancelDownload(req.params.requestId);
  if (cancelled) {
    res.json({ message: 'Download cancelled', requestId: req.params.requestId });
  } else {
    res.status(400).json({ error: 'No active download to cancel' });
  }
});

// POST /api/downloads/batch - Download multiple
router.post('/batch', async (req, res) => {
  const { request_ids, output_dir } = req.body;

  if (!request_ids || !Array.isArray(request_ids) || request_ids.length === 0) {
    return res.status(400).json({ error: 'request_ids array is required' });
  }

  const results = [];

  for (const requestId of request_ids) {
    const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(requestId);
    if (!request) {
      results.push({ requestId, status: 'error', error: 'Request not found' });
      continue;
    }

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(request.event_id);
    let dir = output_dir;
    if (!dir) {
      const safeName = event.name.replace(/[^a-zA-Z0-9]/g, '_');
      dir = path.join(
        process.env.HOME || '/tmp',
        'Music', 'DJ_Events',
        `${event.event_date || 'undated'}_${safeName}`,
        'downloaded'
      );
    }

    try {
      startDownload(requestId, dir).catch(err => {
        console.error(`Batch download failed for ${requestId}:`, err.message);
      });
      results.push({ requestId, status: 'downloading', outputDir: dir });
    } catch (err) {
      results.push({ requestId, status: 'error', error: err.message });
    }
  }

  res.json({ message: 'Batch download started', downloads: results });
});

module.exports = router;
