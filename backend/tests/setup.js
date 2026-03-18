const express = require('express');
const db = require('../database/db');

/**
 * Reset database to clean state. Call in beforeEach().
 */
function resetDb() {
  db._resetForTest();
}

/**
 * Create an Express app wired to all routes.
 */
function createApp() {
  const app = express();
  app.use(express.json());

  app.use('/api/dj', require('../routes/dj'));
  app.use('/api/events', require('../routes/events'));
  app.use('/api/guests', require('../routes/guests'));
  app.use('/api/requests', require('../routes/requests'));
  app.use('/api/contacts', require('../routes/contacts'));

  app.use((err, req, res, next) => {
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { db, resetDb, createApp };
