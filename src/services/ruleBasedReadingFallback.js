/**
 * Rule-based palm/face readings when AI vision is unavailable (no key, 429, timeout).
 * Keeps the app usable for testing and production degrade mode.
 */

function buildPalmRuleBasedFallback(images = {}, userContext = {}) {
  const hand = userContext.hand || 'both';
  const label = userContext.name ? `${userContext.name}'s` : 'your';

  return {
    fateLineAnalysis:
      `Hasta Samudrika assessment for ${label} ${hand} hand: the fate line pattern indicates career direction shaped by persistence and mid-career consolidation. Progress strengthens when goals align with natural strengths rather than short-term trends.`,
    headLineAnalysis:
      'The head line profile suggests analytical processing with practical decision-making. You benefit from roles that combine structured thinking with visible outcomes — planning, operations, or technical leadership.',
    sunLineAnalysis:
      'Sun (Apollo) line indicators support recognition through expertise and consistent delivery. Public visibility grows when you demonstrate mastery in a defined domain.',
    heartLineAnalysis:
      'Heart line balance points to empathy without losing professional boundaries — useful in client-facing, teaching, and team leadership paths.',
    handType: 'earth',
    dominantMount: 'jupiter',
    careerRecommendations:
      'Favour stable growth sectors: operations, finance, education, healthcare administration, or technology delivery roles where discipline and communication both matter.',
    overallRecommendations: [
      'Retake palm photos in bright, even lighting with fingers fully visible',
      'Focus career moves on skill depth before frequent role changes',
      'Align major decisions with your Vedic chart dasha periods when available',
    ],
    confidenceScore: 62,
    analysisParagraphs: [
      'Palm structure in Samudrika Shastra maps execution style: earth-hands tend toward reliability, patience, and tangible results.',
      'A clear head line supports careers requiring analysis, documentation, and step-by-step problem solving.',
      'Fate line strength is read relative to life stage — early years build foundation; mid-career brings consolidation and authority.',
    ],
    aiGenerated: false,
    degraded: true,
    fallbackReason: 'ai_unavailable',
    analysisSource: 'rule-based-palm',
    imagesReceived: Object.keys(images || {}).filter((k) => images[k]),
  };
}

function buildFaceRuleBasedFallback(images = {}, userContext = {}) {
  const label = userContext.name || 'You';

  return {
    faceShape: 'oval',
    dominantFeature: 'forehead',
    personalityTraits: {
      strengths: ['Measured judgment', 'Adaptable communication', 'Steady under pressure'],
      challenges: ['May over-plan before acting', 'Needs clear goals to sustain momentum'],
      communicationStyle:
        `${label} communicates best with structure and clarity — concise briefs and defined expectations improve performance.`,
      workStyle:
        'Prefers environments with accountable teams, visible milestones, and room to deepen expertise over time.',
      overview:
        'Samudrika Shastra profile suggests a balanced achiever pattern: logical foreground with emotional awareness in collaboration.',
    },
    leadershipScore: 72,
    teamworkScore: 76,
    independenceScore: 70,
    careerRecommendations:
      'Suitable paths include project leadership, consulting, product management, education, and client advisory roles where trust and consistency are valued.',
    ageRegionAnalysis:
      'Upper face (forehead) supports planning and learning cycles; mid face indicates execution years; lower face emphasises legacy and long-term impact — align major career pivots with chart dashas when available.',
    confidenceScore: 60,
    analysisParagraphs: [
      'Facial proportion in Vedic physiognomy is read as temperament, not fixed destiny — effort and chart timing still govern outcomes.',
      'Forehead emphasis correlates with strategic thinking and appetite for structured learning.',
      'Balanced lower-face indicators support endurance in leadership and sustained professional relationships.',
    ],
    aiGenerated: false,
    degraded: true,
    fallbackReason: 'ai_unavailable',
    analysisSource: 'rule-based-face',
    imagesReceived: Object.keys(images || {}).filter((k) => images[k]),
  };
}

module.exports = {
  buildPalmRuleBasedFallback,
  buildFaceRuleBasedFallback,
};
