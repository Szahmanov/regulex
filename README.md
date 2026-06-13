# Regulex by StaGove
**Автономен регулаторен мониторинг агент**

Regulex следи регулаторни промени в България и ЕС и изпраща ежедневен дайджест до абонатите — автоматично, без намеса от потребителя.

## Как работи
1. Потребителят въвежда теми (НАП, ДДС, осигуровки) и час за имейл
2. Агентът сканира Google News за тези теми всеки час
3. LLM (Groq/Llama) анализира дали новината е регулаторна промяна
4. В избрания час потребителят получава имейл — с нови алерти или обобщение на последните

## Deployment на Render

1. Качи кода в GitHub
2. Създай нов Web Service в render.com
3. Свържи GitHub repo
4. Добави Environment Variables:
   - `GROQ_API_KEY` — от console.groq.com
   - `EMAIL_USER` — regulex.sg@gmail.com
   - `EMAIL_PASS` — Gmail App Password
5. Start Command: `node server.js`
6. Deploy!

## Структура
```
regulex/
├── server.js          # Express + cron scheduler
├── agent/
│   ├── scanner.js     # Google News RSS сканиране
│   ├── analyzer.js    # Groq LLM анализ
│   └── notifier.js    # Email дайджест
├── db/
│   └── database.js    # SQLite
├── public/
│   ├── index.html     # PWA интерфейс
│   ├── manifest.json
│   └── sw.js
└── package.json
```
