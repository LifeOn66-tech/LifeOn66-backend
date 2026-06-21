const { analyzePalmWithVision, isAiEnabled } = require('./aiReadingService');
const { buildPalmRuleBasedFallback } = require('./ruleBasedReadingFallback');
const { applyPalmWordLimits } = require('../config/readingWordLimits');

async function analyzePalm(images = {}, userContext = {}) {
  const normalized = {
    left: images.left || images.palmLeft,
    right: images.right || images.palmRight,
    both: images.both || images.palmBoth,
  };

  const hasImages = Object.values(normalized).some(Boolean);

  if (!isAiEnabled() || !hasImages) {
    return applyPalmWordLimits(buildPalmRuleBasedFallback(normalized, userContext));
  }

  try {
    const ai = await analyzePalmWithVision(normalized, userContext);
    if (!ai) return applyPalmWordLimits(buildPalmRuleBasedFallback(normalized, userContext));

    return applyPalmWordLimits({
      fateLineAnalysis: ai.fateLineAnalysis || '',
      headLineAnalysis: ai.headLineAnalysis || '',
      sunLineAnalysis: ai.sunLineAnalysis || '',
      heartLineAnalysis: ai.heartLineAnalysis || '',
      handType: ai.handType,
      dominantMount: ai.dominantMount,
      careerRecommendations: ai.careerRecommendations || (ai.overallRecommendations || []).join(' '),
      overallRecommendations: ai.overallRecommendations || [],
      confidenceScore: ai.confidenceScore || 80,
      analysisParagraphs: ai.analysisParagraphs || [],
      aiGenerated: true,
      degraded: false,
      analysisSource: 'ai-vision',
    });
  } catch (err) {
    console.warn('[Palm] AI failed, using rule-based fallback:', err.message);
    return applyPalmWordLimits(buildPalmRuleBasedFallback(normalized, userContext));
  }
}

module.exports = { analyzePalm };
