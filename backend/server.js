require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./database/db');
const djRoutes = require('./routes/dj');
const eventRoutes = require('./routes/events');
const guestRoutes = require('./routes/guests');
const requestRoutes = require('./routes/requests');
const searchRoutes = require('./routes/search');
const libraryRoutes = require('./routes/library');
const downloadRoutes = require('./routes/downloads');
const contactRoutes = require('./routes/contacts');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/dj', djRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/downloads', downloadRoutes);
app.use('/api/contacts', contactRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`DJ Request App server running on port ${PORT}`);
});
