/**
 * Verifies OPENAI_API_KEY works with this backend (chat/completions + vision model).
 * Run: node scratch/test-openai.js
 */
require('dotenv').config();
const { isAiEnabled } = require('../src/services/aiReadingService');

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is empty. Paste your full sk-proj-... key in .env line 19.');
    process.exit(1);
  }

  console.log('AI enabled:', isAiEnabled());
  console.log('Model:', process.env.OPENAI_MODEL || 'gpt-4o-mini');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
      max_tokens: 10,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error('OpenAI test FAILED:', res.status, text.slice(0, 300));
    process.exit(1);
  }

  const data = JSON.parse(text);
  console.log('OpenAI test OK:', data.choices?.[0]?.message?.content?.trim());
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
