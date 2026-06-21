/**
 * AI layer for AstroTalk-style personalized readings.
 * Uses OPENAI_API_KEY (preferred) or GEMINI_API_KEY when configured.
 * Falls back to null so callers use rule-based chart engine.
 */

const {
  READING_WORD_LIMITS,
  applyAstrologyWordLimits,
  applyPalmWordLimits,
  applyFaceWordLimits,
  applyCareerInsightWordLimits,
} = require('../config/readingWordLimits');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

function isAiEnabled() {
  if (process.env.AI_ENABLED === 'false') return false;
  return Boolean(OPENAI_API_KEY || GEMINI_API_KEY);
}

function isRecoverableAiError(err) {
  const msg = String(err?.message || err || '').toLowerCase();
  return (
    msg.includes('429')
    || msg.includes('quota')
    || msg.includes('insufficient_quota')
    || msg.includes('rate limit')
    || msg.includes('resource_exhausted')
    || msg.includes('too many requests')
    || msg.includes('503')
    || msg.includes('502')
    || msg.includes('timeout')
    || msg.includes('timed out')
    || msg.includes('fetch failed')
    || msg.includes('econnreset')
  );
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
  if (!isAiEnabled()) return null;

  if (OPENAI_API_KEY) {
    try {
      return await callOpenAI(opts);
    } catch (err) {
      const msg = err.message || '';
      console.warn('[AI] OpenAI call failed:', msg.slice(0, 160));
      if (GEMINI_API_KEY && isRecoverableAiError(err)) {
        try {
          return await callGemini(opts);
        } catch (geminiErr) {
          console.warn('[AI] Gemini fallback failed:', geminiErr.message?.slice(0, 160));
          return null;
        }
      }
      if (isRecoverableAiError(err)) return null;
      throw err;
    }
  }

  if (GEMINI_API_KEY) {
    try {
      return await callGemini(opts);
    } catch (err) {
      console.warn('[AI] Gemini call failed:', err.message?.slice(0, 160));
      if (isRecoverableAiError(err)) return null;
      throw err;
    }
  }

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

  const L = READING_WORD_LIMITS.astrology;

  const system = `You are a senior Vedic astrologer (Jyotish Acharya) specializing in career guidance.
You receive REAL calculated birth chart data (not generic zodiac horoscopes).
Write unique, specific analysis ONLY from the provided chart facts — planet signs, houses, degrees, dashas, yogas, nakshatra.
Never give the same reading to different charts. Never use sun-sign-only generic text.
Reference exact placements like "Jupiter as 10th lord in the 4th house at 17°".
STRICT word limits — stay within each limit; be detailed but concise. Do not exceed limits.
Respond in JSON only.`;

  const user = `Analyze this unique Vedic birth chart for career guidance:

${JSON.stringify(chartPayload, null, 2)}

Return JSON (respect word limits exactly):
{
  "overview": "personalized chart summary (max ${L.overview} words)",
  "careerHouseAnalysis": "10th house and 10th lord analysis (max ${L.careerHouseAnalysis} words)",
  "careerRecommendations": "career directions with chart reasoning (max ${L.careerRecommendations} words)",
  "favorablePeriods": ["each period max ${L.favorablePeriod} words", ...],
  "analysisParagraphs": ["each paragraph max ${L.analysisParagraph} words", ... exactly ${L.analysisParagraphCount} paragraphs],
  "careerPaths": [{"title": "...", "reasoning": "max ${L.careerPathReasoning} words", "match": "85%"}],
  "yogas": ["each yoga max ${L.yoga} words", ...],
  "remedies": ["each remedy max ${L.remedy} words", ...],
  "confidenceScore": 88
}`;

  try {
    const raw = await callLLM({ system, user, jsonMode: true });
    const parsed = parseJsonSafe(raw);
    if (!parsed || !Object.keys(parsed).length) return null;
    return applyAstrologyWordLimits(parsed);
  } catch (err) {
    console.warn('[AI] Astrology narrative failed:', err.message);
    return null;
  }
}

async function analyzePalmWithVision(images, userContext = {}) {
  if (!isAiEnabled()) return null;

  const imageList = [images.left, images.right, images.both].filter(Boolean);
  if (!imageList.length) return null;

  const L = READING_WORD_LIMITS.palmistry;

  const system = `You are an expert in Hasta Samudrika Shastra (Vedic palmistry) for career analysis.
Analyze the ACTUAL palm images provided. Describe what you see: fate line, head line, heart line, sun line, mounts, hand shape.
If image quality is poor, say so and analyze what is visible.
Each reading must be unique to the visible palm features — never generic template text.
STRICT word limits — stay within each limit; be detailed but concise. Do not exceed limits.
Respond in JSON only.`;

  const user = `Analyze these palm images for career palmistry reading.
User context: ${JSON.stringify(userContext)}

Return JSON (respect word limits exactly):
{
  "fateLineAnalysis": "fate line reading (max ${L.lineAnalysis} words)",
  "headLineAnalysis": "head line reading (max ${L.lineAnalysis} words)",
  "sunLineAnalysis": "sun/apollo line reading (max ${L.lineAnalysis} words)",
  "heartLineAnalysis": "heart line if visible (max ${L.lineAnalysis} words)",
  "handType": "earth|air|water|fire",
  "dominantMount": "jupiter|saturn|apollo|mercury|venus|luna|mars",
  "careerRecommendations": "career paths from palm features (max ${L.careerRecommendations} words)",
  "overallRecommendations": ["each max ${L.recommendationItem} words", ...],
  "confidenceScore": 75,
  "analysisParagraphs": ["each max ${L.analysisParagraph} words", ... exactly ${L.analysisParagraphCount} paragraphs]
}`;

  try {
    const raw = await callLLM({ system, user, images: imageList, jsonMode: true });
    const parsed = parseJsonSafe(raw);
    if (!parsed || !Object.keys(parsed).length) return null;
    return applyPalmWordLimits(parsed);
  } catch (err) {
    console.warn('[AI] Palm vision failed:', err.message);
    return null;
  }
}

async function analyzeFaceWithVision(images, userContext = {}) {
  if (!isAiEnabled()) return null;

  const imageList = [images.center, images.left, images.right].filter(Boolean);
  if (!imageList.length) return null;

  const L = READING_WORD_LIMITS.face;

  const system = `You are an expert in Samudrika Shastra (Vedic physiognomy) for career and personality analysis.
Analyze the ACTUAL face images: forehead, eyes, nose, mouth, chin, face shape.
Base every statement on visible features in these specific images.
Each reading must be unique — never generic template text.
STRICT word limits — stay within each limit; be detailed but concise. Do not exceed limits.
Respond in JSON only.`;

  const user = `Analyze these face images for career physiognomy reading.
User context: ${JSON.stringify(userContext)}

Return JSON (respect word limits exactly):
{
  "faceShape": "oval|round|square|heart|oblong|diamond|triangle",
  "dominantFeature": "forehead|eyes|nose|mouth|chin",
  "personalityTraits": {
    "strengths": ["each max ${L.traitItem} words", ...],
    "challenges": ["each max ${L.traitItem} words", ...],
    "communicationStyle": "max ${L.communicationStyle} words",
    "workStyle": "max ${L.workStyle} words"
  },
  "leadershipScore": 78,
  "teamworkScore": 82,
  "independenceScore": 75,
  "careerRecommendations": "career paths from facial features (max ${L.careerRecommendations} words)",
  "ageRegionAnalysis": "upper/middle/lower face timing (max ${L.ageRegionAnalysis} words)",
  "confidenceScore": 80,
  "analysisParagraphs": ["each max ${L.analysisParagraph} words", ... exactly ${L.analysisParagraphCount} paragraphs]
}`;

  try {
    const raw = await callLLM({ system, user, images: imageList, jsonMode: true });
    const parsed = parseJsonSafe(raw);
    if (!parsed || !Object.keys(parsed).length) return null;
    return applyFaceWordLimits(parsed);
  } catch (err) {
    console.warn('[AI] Face vision failed:', err.message);
    return null;
  }
}

async function synthesizeCareerInsight({ astrology, palmistry, face, userDetails }) {
  if (!isAiEnabled()) return null;

  const L = READING_WORD_LIMITS.careerInsight;

  const system = `You are a master career astrologer synthesizing Vedic astrology, palmistry, and face reading.
Combine all three readings into one unified career blueprint. Reference specific facts from each source.
Never contradict the chart data. Output unique synthesis per user.
STRICT word limits — stay within each limit; be detailed but concise. Do not exceed limits.
Respond in JSON only.`;

  const user = `Synthesize career insight:

Birth details: ${JSON.stringify(userDetails)}
Astrology: ${JSON.stringify(astrology)}
Palmistry: ${JSON.stringify(palmistry)}
Face reading: ${JSON.stringify(face)}

Return JSON (respect word limits exactly):
{
  "synthesizedRecommendation": "unified career verdict (max ${L.synthesizedRecommendation} words)",
  "topCareerPaths": [{"title": "...", "match": "92%", "reasoning": "max ${L.pathReasoning} words"}],
  "strengths": ["each max ${L.traitItem} words", ...],
  "challenges": ["each max ${L.traitItem} words", ...],
  "sixMonthPathway": [{"month": "Month 1-2", "focus": "max ${L.pathwayFocus} words", "actions": "max ${L.pathwayActions} words"}],
  "threeYearPathway": [{"year": "Year 1", "milestone": "max ${L.pathwayFocus} words", "focus": "max ${L.pathwayFocus} words"}],
  "confidenceScore": 90
}`;

  try {
    const raw = await callLLM({ system, user, jsonMode: true });
    const parsed = parseJsonSafe(raw);
    if (!parsed || !Object.keys(parsed).length) return null;
    return applyCareerInsightWordLimits(parsed);
  } catch (err) {
    console.warn('[AI] Career synthesis failed:', err.message);
    return null;
  }
}

module.exports = {
  isAiEnabled,
  generateAstrologyNarrative,
  analyzePalmWithVision,
  analyzeFaceWithVision,
  synthesizeCareerInsight,
};
