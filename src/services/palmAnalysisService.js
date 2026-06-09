const { analyzePalmWithVision, isAiEnabled } = require('./aiReadingService');

function buildRuleBasedFallback(images) {
  return {
    fateLineAnalysis: 'Upload clear palm images and configure OPENAI_API_KEY or GEMINI_API_KEY for AI-powered palm line analysis from your actual photos.',
    headLineAnalysis: 'Head line analysis requires vision AI — enable API key in backend .env for real Hasta Samudrika reading.',
    sunLineAnalysis: 'Sun line analysis pending — backend AI vision not configured.',
    careerRecommendations: 'Complete AI palm analysis for personalized career guidance from your palm lines.',
    overallRecommendations: ['Retake palm photos in good lighting with all major lines visible', 'Configure AI API key on backend for real analysis'],
    confidenceScore: 0,
    analysisParagraphs: [],
    aiGenerated: false,
    requiresAiKey: true,
    imagesReceived: Object.keys(images || {}).filter((k) => images[k]),
  };
}

async function analyzePalm(images = {}, userContext = {}) {
  const normalized = {
    left: images.left || images.palmLeft,
    right: images.right || images.palmRight,
    both: images.both || images.palmBoth,
  };

  if (!isAiEnabled()) {
    return buildRuleBasedFallback(normalized);
  }

  const ai = await analyzePalmWithVision(normalized, userContext);
  if (!ai) return buildRuleBasedFallback(normalized);

  return {
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
    requiresAiKey: false,
  };
}

module.exports = { analyzePalm };
