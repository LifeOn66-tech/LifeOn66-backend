/**
 * Word limits for reading API responses.
 * Keeps AI and rule-based text detailed but consistently sized for the UI.
 */

const READING_WORD_LIMITS = {
  astrology: {
    overview: 75,
    careerHouseAnalysis: 100,
    careerRecommendations: 100,
    analysisParagraph: 70,
    analysisParagraphCount: 6,
    favorablePeriod: 40,
    careerPathReasoning: 45,
    yoga: 35,
    remedy: 25,
    planetInterpretation: 55,
    dashaEffect: 50,
  },
  palmistry: {
    lineAnalysis: 70,
    careerRecommendations: 90,
    recommendationItem: 22,
    analysisParagraph: 65,
    analysisParagraphCount: 3,
  },
  face: {
    communicationStyle: 45,
    workStyle: 45,
    overview: 60,
    careerRecommendations: 90,
    ageRegionAnalysis: 80,
    traitItem: 15,
    analysisParagraph: 65,
    analysisParagraphCount: 3,
  },
  careerInsight: {
    synthesizedRecommendation: 90,
    pathReasoning: 45,
    traitItem: 15,
    pathwayFocus: 40,
    pathwayActions: 50,
  },
};

function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function truncateToWords(text, maxWords) {
  if (!text || typeof text !== 'string') return text || '';
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(' ')}…`;
}

function limitText(text, maxWords) {
  return truncateToWords(text, maxWords);
}

function limitStringArray(arr, maxWordsPerItem, maxItems) {
  if (!Array.isArray(arr)) return arr;
  const limited = arr
    .filter((item) => typeof item === 'string' && item.trim())
    .map((item) => limitText(item, maxWordsPerItem));
  return maxItems != null ? limited.slice(0, maxItems) : limited;
}

function limitCareerPaths(paths, reasoningLimit) {
  if (!Array.isArray(paths)) return paths;
  return paths.map((path) => {
    if (!path || typeof path !== 'object') return path;
    return {
      ...path,
      reasoning: path.reasoning ? limitText(path.reasoning, reasoningLimit) : path.reasoning,
    };
  });
}

function applyAstrologyWordLimits(chart = {}) {
  const L = READING_WORD_LIMITS.astrology;
  const result = { ...chart };

  if (result.careerHouseAnalysis) {
    result.careerHouseAnalysis = limitText(result.careerHouseAnalysis, L.careerHouseAnalysis);
  }
  if (result.careerHouse) {
    result.careerHouse = limitText(result.careerHouse, L.careerHouseAnalysis);
  }
  if (result.careerRecommendations) {
    result.careerRecommendations = limitText(result.careerRecommendations, L.careerRecommendations);
  }
  if (result.analysisParagraphs) {
    result.analysisParagraphs = limitStringArray(
      result.analysisParagraphs,
      L.analysisParagraph,
      L.analysisParagraphCount
    );
  }
  if (result.favorablePeriods) {
    result.favorablePeriods = limitStringArray(result.favorablePeriods, L.favorablePeriod);
  }
  if (result.yogas) {
    result.yogas = limitStringArray(result.yogas, L.yoga);
  }
  if (result.remedies) {
    result.remedies = limitStringArray(result.remedies, L.remedy);
  }
  if (result.careerPaths) {
    result.careerPaths = limitCareerPaths(result.careerPaths, L.careerPathReasoning);
  }
  if (result.planetInterpretations) {
    result.planetInterpretations = result.planetInterpretations.map((item) => {
      if (!item || typeof item !== 'object') return item;
      const interpretation = item.interpretation ?? item.text ?? item.description;
      if (!interpretation) return item;
      const key = item.interpretation != null ? 'interpretation' : item.text != null ? 'text' : 'description';
      return { ...item, [key]: limitText(interpretation, L.planetInterpretation) };
    });
  }
  if (result.dashas) {
    result.dashas = result.dashas.map((d) => ({
      ...d,
      effect: d.effect ? limitText(d.effect, L.dashaEffect) : d.effect,
    }));
  }
  if (result.birthChartData) {
    result.birthChartData = applyAstrologyWordLimits(result.birthChartData);
  }

  return result;
}

function applyPalmWordLimits(palm = {}) {
  const L = READING_WORD_LIMITS.palmistry;
  const result = { ...palm };

  for (const field of ['fateLineAnalysis', 'headLineAnalysis', 'sunLineAnalysis', 'heartLineAnalysis']) {
    if (result[field]) result[field] = limitText(result[field], L.lineAnalysis);
  }
  if (result.careerRecommendations) {
    result.careerRecommendations = limitText(result.careerRecommendations, L.careerRecommendations);
  }
  if (result.overallRecommendations) {
    result.overallRecommendations = limitStringArray(result.overallRecommendations, L.recommendationItem);
  }
  if (result.analysisParagraphs) {
    result.analysisParagraphs = limitStringArray(
      result.analysisParagraphs,
      L.analysisParagraph,
      L.analysisParagraphCount
    );
  }

  return result;
}

function applyFaceWordLimits(face = {}) {
  const L = READING_WORD_LIMITS.face;
  const result = { ...face };

  if (result.careerRecommendations) {
    result.careerRecommendations = limitText(result.careerRecommendations, L.careerRecommendations);
  }
  if (result.ageRegionAnalysis) {
    result.ageRegionAnalysis = limitText(result.ageRegionAnalysis, L.ageRegionAnalysis);
  }
  if (result.analysisParagraphs) {
    result.analysisParagraphs = limitStringArray(
      result.analysisParagraphs,
      L.analysisParagraph,
      L.analysisParagraphCount
    );
  }
  if (result.personalityTraits && typeof result.personalityTraits === 'object') {
    const traits = { ...result.personalityTraits };
    if (traits.strengths) traits.strengths = limitStringArray(traits.strengths, L.traitItem);
    if (traits.challenges) traits.challenges = limitStringArray(traits.challenges, L.traitItem);
    if (traits.communicationStyle) {
      traits.communicationStyle = limitText(traits.communicationStyle, L.communicationStyle);
    }
    if (traits.workStyle) traits.workStyle = limitText(traits.workStyle, L.workStyle);
    if (traits.overview) traits.overview = limitText(traits.overview, L.overview);
    result.personalityTraits = traits;
  }

  return result;
}

function applyCareerInsightWordLimits(insight = {}) {
  const L = READING_WORD_LIMITS.careerInsight;
  const result = { ...insight };

  if (result.synthesizedRecommendation) {
    result.synthesizedRecommendation = limitText(result.synthesizedRecommendation, L.synthesizedRecommendation);
  }
  if (result.topCareerPaths) {
    result.topCareerPaths = limitCareerPaths(result.topCareerPaths, L.pathReasoning);
  }
  if (result.strengths) result.strengths = limitStringArray(result.strengths, L.traitItem);
  if (result.challenges) result.challenges = limitStringArray(result.challenges, L.traitItem);
  if (result.sixMonthPathway) {
    result.sixMonthPathway = result.sixMonthPathway.map((step) => ({
      ...step,
      focus: step.focus ? limitText(step.focus, L.pathwayFocus) : step.focus,
      actions: step.actions ? limitText(step.actions, L.pathwayActions) : step.actions,
    }));
  }
  if (result.threeYearPathway) {
    result.threeYearPathway = result.threeYearPathway.map((step) => ({
      ...step,
      milestone: step.milestone ? limitText(step.milestone, L.pathwayFocus) : step.milestone,
      focus: step.focus ? limitText(step.focus, L.pathwayFocus) : step.focus,
    }));
  }

  return result;
}

function buildWordLimitPrompt(limits) {
  return Object.entries(limits)
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => `${key}: max ${value} words`)
    .join(', ');
}

module.exports = {
  READING_WORD_LIMITS,
  countWords,
  truncateToWords,
  limitText,
  applyAstrologyWordLimits,
  applyPalmWordLimits,
  applyFaceWordLimits,
  applyCareerInsightWordLimits,
  buildWordLimitPrompt,
};
