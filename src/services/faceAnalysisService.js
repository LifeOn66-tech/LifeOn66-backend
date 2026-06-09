const { analyzeFaceWithVision, isAiEnabled } = require('./aiReadingService');

function buildRuleBasedFallback(images) {
  return {
    faceShape: 'unknown',
    dominantFeature: 'unknown',
    personalityTraits: {
      strengths: [],
      challenges: [],
      communicationStyle: 'Configure OPENAI_API_KEY or GEMINI_API_KEY for real physiognomy analysis.',
      workStyle: 'Face reading requires AI vision on backend.',
    },
    leadershipScore: 0,
    teamworkScore: 0,
    independenceScore: 0,
    careerRecommendations: 'Upload face photos and enable AI API key for personalized Samudrika Shastra reading.',
    ageRegionAnalysis: '',
    confidenceScore: 0,
    analysisParagraphs: [],
    aiGenerated: false,
    requiresAiKey: true,
    imagesReceived: Object.keys(images || {}).filter((k) => images[k]),
  };
}

async function analyzeFace(images = {}, userContext = {}) {
  const normalized = {
    center: images.center || images.front || images.faceCenter,
    left: images.left || images.faceLeft,
    right: images.right || images.faceRight,
  };

  if (!isAiEnabled()) {
    return buildRuleBasedFallback(normalized);
  }

  const ai = await analyzeFaceWithVision(normalized, userContext);
  if (!ai) return buildRuleBasedFallback(normalized);

  return {
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
    requiresAiKey: false,
  };
}

module.exports = { analyzeFace };
