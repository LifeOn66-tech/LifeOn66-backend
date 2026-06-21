/**
 * Verifies GEMINI_API_KEY works (supports AIzaSy and AQ. formats).
 * Run: node scratch/test-gemini.js
 */
require('dotenv').config();

async function main() {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  if (!key) {
    console.error('GEMINI_API_KEY is empty.');
    process.exit(1);
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with exactly: OK' }] }] }),
    }
  );

  const text = await res.text();
  if (!res.ok) {
    console.error('Gemini test FAILED:', res.status, text.slice(0, 400));
    if (res.status === 429) {
      console.error('Quota exceeded — wait or check https://aistudio.google.com');
    }
    process.exit(1);
  }

  const data = JSON.parse(text);
  console.log('Gemini test OK:', data.candidates?.[0]?.content?.parts?.[0]?.text?.trim());
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
