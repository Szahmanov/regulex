const Groq = require('groq-sdk');

let groq;
function getGroq() {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
}

async function analyzeText(text, topic) {
  try {
    const response = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 600,
      messages: [{
        role: 'system',
        content: `Ти си регулаторен анализатор за България. Анализираш новини и регулаторни промени.
Отговаряш САМО с валиден JSON, без markdown, без обяснения.`
      }, {
        role: 'user',
        content: `Анализирай следния текст свързан с темата "${topic}":

"${text.slice(0, 1000)}"

Върни JSON в точно този формат:
{
  "relevant": true,
  "summary": "Кратко обяснение на промяната на български (2-3 изречения). Какво означава за бизнеса.",
  "source": "Името на медията/институцията ако е видимо",
  "severity": "висока или средна или ниска",
  "action": "Конкретно действие което бизнесът трябва да предприеме, или 'Няма нужда от действие'"
}

Ако текстът НЕ е свързан с регулации, закони, данъци, осигуровки или бизнес промени, върни:
{"relevant": false}`
      }]
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return null;

    const clean = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    if (!parsed.relevant) return null;
    return parsed;
  } catch (e) {
    console.error('Грешка при анализ:', e.message);
    return null;
  }
}

module.exports = { analyzeText };
