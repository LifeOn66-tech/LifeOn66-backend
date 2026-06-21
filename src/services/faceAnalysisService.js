const { analyzeFaceWithVision, isAiEnabled } = require('./aiReadingService');
const { buildFaceRuleBasedFallback } = require('./ruleBasedReadingFallback');
const { applyFaceWordLimits } = require('../config/readingWordLimits');

async function analyzeFace(images = {}, userContext = {}) {
  const normalized = {
    center: images.center || images.front || images.faceCenter,
    left: images.left || images.faceLeft,
    right: images.right || images.faceRight,
  };

  const hasImages = Object.values(normalized).some(Boolean);

  if (!isAiEnabled() || !hasImages) {
    return applyFaceWordLimits(buildFaceRuleBasedFallback(normalized, userContext));
  }

  try {
    const ai = await analyzeFaceWithVision(normalized, userContext);
    if (!ai) return applyFaceWordLimits(buildFaceRuleBasedFallback(normalized, userContext));

    return applyFaceWordLimits({
      faceShape: ai.faceShape,
      dominantFeature: ai.dominantFeature,
      personalityTraits: ai.personalityTraits || {},
      leadershipScore: ai.leadershipScore || 75,
      teamworkScore: ai.teamworkScore || 75,
      independenceScore: ai.independenceScore || 75,
      careerRecommendations: ai.careerRecommendations || '',
      ageRegionAnalysis: ai.ageRegionAnalysis || '',
      confidenceScore: ai.confidenceScore || 80,
      analysisParagraphs: ai.analysisParagraphs || [],
      aiGenerated: true,
      degraded: false,
      analysisSource: 'ai-vision',
    });
  } catch (err) {
    console.warn('[Face] AI failed, using rule-based fallback:', err.message);
    return applyFaceWordLimits(buildFaceRuleBasedFallback(normalized, userContext));
  }
}

module.exports = { analyzeFace };
