require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const path = require('path');
const db = require('./db/database');
const { runAgentLoop } = require('./agent/scanner');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/alerts', (req, res) => {
  const alerts = db.prepare('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 50').all();
  res.json(alerts);
});

app.post('/api/register', (req, res) => {
  const { email, topics, alert_hour } = req.body;
  if (!email || !topics) return res.status(400).json({ error: 'Липсва имейл или теми.' });
  try {
    db.prepare('INSERT OR REPLACE INTO users (email, topics, alert_hour) VALUES (?, ?, ?)')
      .run(email, topics, alert_hour || 8);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/unsubscribe', (req, res) => {
  const { email } = req.body;
  db.prepare('DELETE FROM users WHERE email = ?').run(email);
  res.json({ success: true });
});

// Check every hour — run agent for users whose alert_hour matches current hour
cron.schedule('0 * * * *', () => {
  const hour = new Date().getHours();
  console.log(`🕐 Проверка в ${hour}:00`);
  runAgentLoop(hour);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Regulex работи на порт ${PORT}`);
});
