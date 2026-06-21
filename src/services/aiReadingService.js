/**
 * AI layer for AstroTalk-style personalized readings.
 * Uses OPENAI_API_KEY (preferred) or GEMINI_API_KEY when configured.
 * Falls back to null so callers use rule-based chart engine.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

function isAiEnabled() {
  return Boolean(OPENAI_API_KEY || GEMINI_API_KEY);
}

async function callOpenAI({ system, user, images = [], jsonMode = true }) {
  const content = [{ type: 'text', text: user }];
  for (const img of images) {
    if (img) content.push({ type: 'image_url', image_url: { url: img, detail: 'high' } });
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: images.length ? content : user },
      ],
      temperature: 0.75,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callGemini({ system, user, images = [], jsonMode = true }) {
  const parts = [{ text: `${system}\n\n${user}` }];
  for (const img of images) {
    if (!img?.startsWith('data:')) continue;
    const [, meta, b64] = img.match(/^data:([^;]+);base64,(.+)$/) || [];
    if (b64) parts.push({ inline_data: { mime_type: meta || 'image/jpeg', data: b64 } });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.75,
        ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callLLM(opts) {
  if (OPENAI_API_KEY) {
    try {
      return await callOpenAI(opts);
    } catch (err) {
      const msg = err.message || '';
      const quotaHit = msg.includes('429') || msg.includes('quota') || msg.includes('insufficient_quota');
      if (GEMINI_API_KEY && quotaHit) {
        console.warn('[AI] OpenAI unavailable, using Gemini:', msg.slice(0, 120));
        return callGemini(opts);
      }
      throw err;
    }
  }
  if (GEMINI_API_KEY) return callGemini(opts);
  return null;
}

function parseJsonSafe(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* ignore */ }
    }
    return null;
  }
}

async function generateAstrologyNarrative(chartPayload) {
  if (!isAiEnabled()) return null;

  const system = `You are a senior Vedic astrologer (Jyotish Acharya) specializing in career guidance.
You receive REAL calculated birth chart data (not generic zodiac horoscopes).
Write unique, specific analysis ONLY from the provided chart facts — planet signs, houses, degrees, dashas, yogas, nakshatra.
Never give the same reading to different charts. Never use sun-sign-only generic text.
Reference exact placements like "Jupiter as 10th lord in the 4th house at 17°".
Respond in JSON only.`;

  const user = `Analyze this unique Vedic birth chart for career guidance:

${JSON.stringify(chartPayload, null, 2)}

Return JSON:
{
  "overview": "3-4 sentence personalized chart summary",
  "careerHouseAnalysis": "detailed 10th house and 10th lord analysis",
  "careerRecommendations": "specific career directions with reasoning from chart",
  "favorablePeriods": ["period 1 with dasha reasoning", "period 2", ...],
  "analysisParagraphs": ["paragraph 1", "paragraph 2", ... at least 6 unique paragraphs],
  "careerPaths": [{"title": "...", "reasoning": "...", "match": "85%"}],
  "yogas": ["yoga interpretation 1", ...],
  "remedies": ["practical remedy 1", ...],
  "confidenceScore": 88
}`;

  const raw = await callLLM({ system, user, jsonMode: true });
  return parseJsonSafe(raw);
}

async function analyzePalmWithVision(images, userContext = {}) {
  if (!isAiEnabled()) {
    return null;
  }

  const imageList = [images.left, images.right, images.both].filter(Boolean);
  if (!imageList.length) {
    throw new Error('At least one palm image is required for analysis.');
  }

  const system = `You are an expert in Hasta Samudrika Shastra (Vedic palmistry) for career analysis.
Analyze the ACTUAL palm images provided. Describe what you see: fate line, head line, heart line, sun line, mounts, hand shape.
If image quality is poor, say so and analyze what is visible.
Each reading must be unique to the visible palm features — never generic template text.
Respond in JSON only.`;

  const user = `Analyze these palm images for career palmistry reading.
User context: ${JSON.stringify(userContext)}

Return JSON:
{
  "fateLineAnalysis": "detailed fate line reading from visible features",
  "headLineAnalysis": "detailed head line reading",
  "sunLineAnalysis": "sun/apollo line reading",
  "heartLineAnalysis": "heart line if visible",
  "handType": "earth|air|water|fire",
  "dominantMount": "jupiter|saturn|apollo|mercury|venus|luna|mars",
  "careerRecommendations": "career paths based on palm features seen",
  "overallRecommendations": ["recommendation 1", "recommendation 2"],
  "confidenceScore": 75,
  "analysisParagraphs": ["paragraph 1", "paragraph 2", "paragraph 3"]
}`;

  const raw = await callLLM({ system, user, images: imageList, jsonMode: true });
  return parseJsonSafe(raw);
}

async function analyzeFaceWithVision(images, userContext = {}) {
  if (!isAiEnabled()) {
    return null;
  }

  const imageList = [images.center, images.left, images.right].filter(Boolean);
  if (!imageList.length) {
    throw new Error('At least one face image is required for analysis.');
  }

  const system = `You are an expert in Samudrika Shastra (Vedic physiognomy) for career and personality analysis.
Analyze the ACTUAL face images: forehead, eyes, nose, mouth, chin, face shape.
Base every statement on visible features in these specific images.
Each reading must be unique — never generic template text.
Respond in JSON only.`;

  const user = `Analyze these face images for career physiognomy reading.
User context: ${JSON.stringify(userContext)}

Return JSON:
{
  "faceShape": "oval|round|square|heart|oblong|diamond|triangle",
  "dominantFeature": "forehead|eyes|nose|mouth|chin",
  "personalityTraits": {
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "challenges": ["challenge 1", "challenge 2"],
    "communicationStyle": "...",
    "workStyle": "..."
  },
  "leadershipScore": 78,
  "teamworkScore": 82,
  "independenceScore": 75,
  "careerRecommendations": "career paths from facial features",
  "ageRegionAnalysis": "upper/middle/lower face career timing analysis",
  "confidenceScore": 80,
  "analysisParagraphs": ["paragraph 1", "paragraph 2", "paragraph 3"]
}`;

  const raw = await callLLM({ system, user, images: imageList, jsonMode: true });
  return parseJsonSafe(raw);
}

async function synthesizeCareerInsight({ astrology, palmistry, face, userDetails }) {
  if (!isAiEnabled()) return null;

  const system = `You are a master career astrologer synthesizing Vedic astrology, palmistry, and face reading.
Combine all three readings into one unified career blueprint. Reference specific facts from each source.
Never contradict the chart data. Output unique synthesis per user.
Respond in JSON only.`;

  const user = `Synthesize career insight:

Birth details: ${JSON.stringify(userDetails)}
Astrology: ${JSON.stringify(astrology)}
Palmistry: ${JSON.stringify(palmistry)}
Face reading: ${JSON.stringify(face)}

Return JSON:
{
  "synthesizedRecommendation": "unified 4-5 sentence career verdict",
  "topCareerPaths": [{"title": "...", "match": "92%", "reasoning": "..."}],
  "strengths": ["..."],
  "challenges": ["..."],
  "sixMonthPathway": [{"month": "Month 1-2", "focus": "...", "actions": "..."}],
  "threeYearPathway": [{"year": "Year 1", "milestone": "...", "focus": "..."}],
  "confidenceScore": 90
}`;

  const raw = await callLLM({ system, user, jsonMode: true });
  return parseJsonSafe(raw);
}

module.exports = {
  isAiEnabled,
  generateAstrologyNarrative,
  analyzePalmWithVision,
  analyzeFaceWithVision,
  synthesizeCareerInsight,
};
