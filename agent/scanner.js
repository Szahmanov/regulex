const Parser = require('rss-parser');
const db = require('../db/database');
const { analyzeText } = require('./analyzer');
const { sendDailyDigest } = require('./notifier');

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; Regulex/1.0)',
    'Accept': 'application/rss+xml, application/xml, text/xml'
  }
});

// Build Google News RSS URL for a search topic — bypasses all government site blockers
function buildGoogleNewsURL(topic) {
  const encoded = encodeURIComponent(topic);
  return `https://news.google.com/rss/search?q=${encoded}&hl=bg&gl=BG&ceid=BG:bg`;
}

async function fetchFeed(url) {
  try {
    const feed = await parser.parseURL(url);
    return feed.items || [];
  } catch (e) {
    console.error(`Грешка при четене на ${url}:`, e.message);
    return [];
  }
}

async function scanTopics(topics) {
  const topicList = topics.split(',').map(t => t.trim()).filter(Boolean);
  const newAlerts = [];

  for (const topic of topicList) {
    const url = buildGoogleNewsURL(topic);
    const items = await fetchFeed(url);

    for (const item of items.slice(0, 5)) {
      const itemUrl = item.link || item.guid || item.id;
      if (!itemUrl) continue;

      const already = db.prepare('SELECT url FROM seen_urls WHERE url = ?').get(itemUrl);
      if (already) continue;

      db.prepare('INSERT OR IGNORE INTO seen_urls (url) VALUES (?)').run(itemUrl);

      const text = `${item.title}\n${item.contentSnippet || item.content || ''}`;
      const analysis = await analyzeText(text, topic);
      if (!analysis) continue;

      const alertId = db.prepare(
        'INSERT INTO alerts (title, summary, source, topic, severity) VALUES (?, ?, ?, ?, ?)'
      ).run(item.title, analysis.summary, analysis.source || 'Google News', topic, analysis.severity).lastInsertRowid;

      newAlerts.push({
        id: alertId,
        title: item.title,
        summary: analysis.summary,
        topic,
        severity: analysis.severity,
        source: analysis.source || 'Google News'
      });
    }
  }

  return newAlerts;
}

async function runAgentLoop(currentHour) {
  console.log(`🤖 Regulex агент стартира (час: ${currentHour})`);

  const users = db.prepare('SELECT * FROM users WHERE alert_hour = ?').all(currentHour);
  if (users.length === 0) {
    console.log(`Няма потребители за час ${currentHour}.`);
    return;
  }

  for (const user of users) {
    console.log(`📡 Сканиране за: ${user.email} | Теми: ${user.topics}`);

    const newAlerts = await scanTopics(user.topics);

    // Get recent alerts from last 7 days for context
    const recentAlerts = db.prepare(
      `SELECT * FROM alerts WHERE topic IN (${user.topics.split(',').map(() => '?').join(',')})
       AND created_at >= datetime('now', '-7 days')
       ORDER BY created_at DESC LIMIT 5`
    ).all(...user.topics.split(',').map(t => t.trim()));

    await sendDailyDigest(user.email, user.topics, newAlerts, recentAlerts);
    console.log(`✅ Изпратен дайджест до ${user.email}`);
  }

  console.log('✅ Агентът завърши.');
}

module.exports = { runAgentLoop, scanTopics };
