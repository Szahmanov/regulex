const nodemailer = require('nodemailer');

let transporter;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return transporter;
}

function severityColor(s) {
  if (s === 'висока') return '#ef4444';
  if (s === 'средна') return '#f59e0b';
  return '#10b981';
}

function buildAlertHTML(alert) {
  return `
    <div style="border-left:4px solid ${severityColor(alert.severity)};padding:14px 18px;margin-bottom:14px;background:#1a1a2e;border-radius:0 8px 8px 0;">
      <div style="font-weight:700;color:#e0e0e0;margin-bottom:6px;">${alert.title}</div>
      <div style="color:#9ca3af;font-size:14px;margin-bottom:8px;">${alert.summary}</div>
      ${alert.action && alert.action !== 'Няма нужда от действие' ? `<div style="background:#6366f120;padding:8px 12px;border-radius:6px;color:#a5b4fc;font-size:13px;">💡 ${alert.action}</div>` : ''}
      <div style="margin-top:8px;font-size:12px;color:#6b7280;">
        <span style="color:${severityColor(alert.severity)};">● ${alert.severity} важност</span>
        &nbsp;·&nbsp; ${alert.source || 'Google News'}
        &nbsp;·&nbsp; ${alert.topic}
      </div>
    </div>`;
}

async function sendDailyDigest(to, topics, newAlerts, recentAlerts) {
  const hasNew = newAlerts.length > 0;
  const date = new Date().toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' });

  const subject = hasNew
    ? `⚠️ Regulex: ${newAlerts.length} нови промени за ${date}`
    : `✅ Regulex: Няма нови промени за ${date}`;

  const newSection = hasNew
    ? `<h2 style="color:#6366f1;margin-bottom:16px;">🆕 Нови промени днес</h2>${newAlerts.map(buildAlertHTML).join('')}`
    : `<div style="background:#1a1a2e;border-radius:10px;padding:20px;text-align:center;margin-bottom:24px;">
        <div style="font-size:32px;margin-bottom:8px;">✅</div>
        <div style="color:#e0e0e0;font-size:16px;font-weight:600;">Няма нови регулаторни промени днес</div>
        <div style="color:#6b7280;font-size:13px;margin-top:6px;">Regulex следи непрекъснато и ще те уведоми при промяна.</div>
      </div>`;

  const recentSection = recentAlerts.length > 0
    ? `<h2 style="color:#9ca3af;margin:24px 0 16px;font-size:15px;">📋 Последни промени от седмицата</h2>${recentAlerts.map(buildAlertHTML).join('')}`
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:'Segoe UI',sans-serif;background:#0a0a0f;color:#e0e0e0;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:28px;font-weight:800;color:#6366f1;">Regulex</div>
      <div style="color:#6b7280;font-size:13px;">Автономен регулаторен мониторинг by StaGove</div>
      <div style="color:#4b5563;font-size:12px;margin-top:4px;">${date}</div>
    </div>

    <div style="background:#111827;border-radius:14px;padding:24px;margin-bottom:20px;">
      <div style="color:#6b7280;font-size:13px;margin-bottom:16px;">📌 Следени теми: <strong style="color:#a5b4fc;">${topics}</strong></div>
      ${newSection}
    </div>

    ${recentSection ? `<div style="background:#111827;border-radius:14px;padding:24px;">${recentSection}</div>` : ''}

    <div style="text-align:center;margin-top:24px;color:#374151;font-size:12px;">
      Regulex by StaGove · Автономен AI агент
    </div>
  </div>
</body>
</html>`;

  await getTransporter().sendMail({
    from: `"Regulex by StaGove" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
}

module.exports = { sendDailyDigest };
