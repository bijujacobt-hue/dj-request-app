const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '..', '..', process.env.DB_PATH || 'data/dj_requests.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
// Enable foreign keys
db.pragma('foreign_keys = ON');

function initialize() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  console.log('Database initialized at', dbPath);
}

function migrate() {
  // Add footer_text column to events if missing
  const columns = db.pragma('table_info(events)');
  const hasFooterText = columns.some(c => c.name === 'footer_text');
  if (!hasFooterText) {
    db.exec('ALTER TABLE events ADD COLUMN footer_text TEXT');
    console.log('Migration: added footer_text column to events');
  }
}

initialize();
migrate();

module.exports = db;
