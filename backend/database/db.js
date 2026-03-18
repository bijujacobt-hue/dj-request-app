const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST;

let db;

if (isTest) {
  // In test mode, use an in-memory database
  db = new Database(':memory:');
} else {
  const dbPath = path.resolve(__dirname, '..', '..', process.env.DB_PATH || 'data/dj_requests.db');
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);
  console.log('Database initialized at', dbPath);
}

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
// Enable foreign keys
db.pragma('foreign_keys = ON');

const schemaPath = path.join(__dirname, 'schema.sql');

function initialize() {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
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

// Allow tests to reset the database
db._resetForTest = function () {
  if (!isTest) throw new Error('_resetForTest only available in test mode');
  db.exec('DELETE FROM downloads');
  db.exec('DELETE FROM votes');
  db.exec('DELETE FROM contacts');
  db.exec('DELETE FROM library');
  db.exec('DELETE FROM requests');
  db.exec('DELETE FROM guests');
  db.exec('DELETE FROM events');
  db.exec('DELETE FROM djs');
};

module.exports = db;
