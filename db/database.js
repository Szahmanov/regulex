const path = require('path');
const fs = require('fs');

let db;

try {
  const Database = require('better-sqlite3');
  db = new Database(path.join(__dirname, 'regulex.db'));
} catch (e) {
  // Fallback to in-memory store if SQLite fails
  console.warn('SQLite unavailable, using memory store');
  db = {
    _users: [],
    _alerts: [],
    _seen: new Set(),
    prepare: function(sql) {
      const self = this;
      return {
        all: (...args) => {
          if (sql.includes('FROM users')) return self._users;
          if (sql.includes('FROM alerts')) return self._alerts.slice(0, 50);
          return [];
        },
        get: (...args) => {
          if (sql.includes('seen_urls')) return self._seen.has(args[0]) ? {url: args[0]} : undefined;
          if (sql.includes('FROM users')) return self._users.find(u => u.alert_hour == args[0]);
          return undefined;
        },
        run: (...args) => {
          if (sql.includes('INTO users')) {
            const existing = self._users.findIndex(u => u.email === args[0]);
            const user = { email: args[0], topics: args[1], alert_hour: args[2] || 8 };
            if (existing >= 0) self._users[existing] = user;
            else self._users.push(user);
          }
          if (sql.includes('INTO alerts')) {
            self._alerts.unshift({ id: Date.now(), title: args[0], summary: args[1], source: args[2], topic: args[3], severity: args[4], created_at: new Date().toISOString() });
          }
          if (sql.includes('INTO seen_urls')) self._seen.add(args[0]);
          return { lastInsertRowid: Date.now() };
        }
      };
    },
    exec: () => {}
  };
}

// Setup tables if real SQLite
if (db.exec) {
  try {
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
  } catch(e) { console.error('DB setup error:', e.message); }
}

module.exports = db;
