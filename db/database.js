const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'regulex.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    topics TEXT NOT NULL,
    alert_hour INTEGER DEFAULT 8,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    summary TEXT,
    source TEXT,
    topic TEXT,
    severity TEXT DEFAULT 'средна',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS seen_urls (
    url TEXT PRIMARY KEY,
    seen_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;
