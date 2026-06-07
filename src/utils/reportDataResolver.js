const PalmistryReading = require('../models/PalmistryReading');
const FaceReading = require('../models/FaceReading');
const AstrologyReading = require('../models/AstrologyReading');
const CareerInsight = require('../models/CareerInsight');
const {
  collectAllImages,
  isUsableImageSrc,
  extractImageString,
  normalizeToDataUrl,
  extractImagesFromReadingDoc,
} = require('./imageResolver');

function hasValidImages(images = {}) {
  return Object.values(images || {}).some((v) => isUsableImageSrc(v));
}

function mergeImageMaps(...sources) {
  const merged = {};
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;
    for (const [key, value] of Object.entries(source)) {
      const candidate = extractImageString(value);
      if (isUsableImageSrc(candidate)) {
        merged[key] = normalizeToDataUrl(candidate);
      }
    }
  }
  return merged;
}

function pickReadingFields(doc, fields) {
  if (!doc) return {};
  return fields.reduce((acc, field) => {
    if (doc[field] != null && doc[field] !== '') acc[field] = doc[field];
    return acc;
  }, {});
}

async function findReadingWithImages(Model, userId, preferredId) {
  if (preferredId) {
    const linked = await Model.findById(preferredId).lean();
    if (linked && hasValidImages(linked.images)) return linked;
    if (linked) return linked;
  }

  const all = await Model.find({ user: userId }).sort({ createdAt: -1 }).lean();
  return all.find((doc) => hasValidImages(doc.images)) || all[0] || null;
}

async function getOrBuildCareerInsight(userId) {
  const insight = await CareerInsight.findOne({ user: userId }).sort({ createdAt: -1 }).lean();
  if (insight) {
    return { data: insight, synthesized: false };
  }

  const [astrologyDoc, palmistryDoc, faceDoc] = await Promise.all([
    AstrologyReading.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
    PalmistryReading.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
    FaceReading.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
  ]);

  if (!astrologyDoc && !palmistryDoc && !faceDoc) {
    return null;
  }

  const traits = typeof faceDoc?.personalityTraits === 'object' ? faceDoc.personalityTraits : {};
  const careerText = [
    palmistryDoc?.careerRecommendations,
    faceDoc?.careerRecommendations,
    astrologyDoc?.careerRecommendations,
  ].filter(Boolean);

  return {
    data: {
      astrologyReadingId: astrologyDoc?._id,
      palmistryReadingId: palmistryDoc?._id,
      faceReadingId: faceDoc?._id,
      synthesizedRecommendation:
        careerText.join(' ') ||
        'Your combined readings point toward leadership, analytical strength, and long-term career growth.',
      topCareerPaths: careerText.length
        ? careerText.map((title, i) => ({ title, match: `${90 - i * 3}%` }))
        : [],
      strengths: traits.strengths || [],
      challenges: traits.challenges || [],
      confidenceScore:
        palmistryDoc?.confidenceScore || faceDoc?.confidenceScore || astrologyDoc?.confidenceScore || 85,
      bestTiming: astrologyDoc?.favorablePeriods,
      sixMonthPathway: [],
      threeYearPathway: [],
    },
    synthesized: true,
  };
}

/**
 * Loads the user's linked readings (via CareerInsight IDs) and merges images + analysis.
 */
async function enrichReportData(userId, analysis = {}, fullData = {}, user = null, bodyUserDetails = {}) {
  const insightDoc = await CareerInsight.findOne({ user: userId }).sort({ createdAt: -1 }).lean();

  const [palmistryDoc, faceDoc, astrologyDoc] = await Promise.all([
    findReadingWithImages(PalmistryReading, userId, insightDoc?.palmistryReadingId),
    findReadingWithImages(FaceReading, userId, insightDoc?.faceReadingId),
    insightDoc?.astrologyReadingId
      ? AstrologyReading.findById(insightDoc.astrologyReadingId).lean()
      : AstrologyReading.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
  ]);

  const palmImages = mergeImageMaps(
    extractImagesFromReadingDoc(palmistryDoc),
    palmistryDoc?.images,
    fullData.palmistry?.images
  );
  const faceImages = mergeImageMaps(
    extractImagesFromReadingDoc(faceDoc),
    faceDoc?.images,
    fullData.face?.images
  );

  const enrichedFullData = {
    ...fullData,
    palmistry: {
      ...pickReadingFields(palmistryDoc, [
        'fateLineAnalysis',
        'headLineAnalysis',
        'sunLineAnalysis',
        'careerRecommendations',
        'confidenceScore',
      ]),
      ...(fullData.palmistry || {}),
      images: palmImages,
    },
    face: {
      ...pickReadingFields(faceDoc, [
        'personalityTraits',
        'leadershipScore',
        'teamworkScore',
        'independenceScore',
        'careerRecommendations',
        'confidenceScore',
      ]),
      ...(fullData.face || {}),
      images: faceImages,
    },
    astrology: {
      ...(astrologyDoc
        ? { ...astrologyDoc, _id: undefined, user: undefined, createdAt: undefined }
        : {}),
      ...(fullData.astrology || {}),
      images: mergeImageMaps(astrologyDoc?.images, fullData.astrology?.images),
    },
  };

  const enrichedAnalysis = {
    ...(insightDoc || {}),
    ...analysis,
  };

  if (!enrichedAnalysis.topCareerPaths?.length && insightDoc?.topCareerPaths?.length) {
    enrichedAnalysis.topCareerPaths = insightDoc.topCareerPaths;
  }
  if (!enrichedAnalysis.threeYearPathway?.length && insightDoc?.threeYearPathway?.length) {
    enrichedAnalysis.threeYearPathway = insightDoc.threeYearPathway;
  }
  if (!enrichedAnalysis.synthesizedRecommendation && insightDoc?.synthesizedRecommendation) {
    enrichedAnalysis.synthesizedRecommendation = insightDoc.synthesizedRecommendation;
  }
  if (!enrichedAnalysis.strengthsSummary?.length && !enrichedAnalysis.strengths?.length) {
    const traits = typeof faceDoc?.personalityTraits === 'object' ? faceDoc.personalityTraits : {};
    enrichedAnalysis.strengthsSummary = insightDoc?.strengths || traits.strengths || enrichedAnalysis.strengthsSummary;
  }
  if (!enrichedAnalysis.planets?.length && astrologyDoc?.planets?.length) {
    enrichedAnalysis.planets = astrologyDoc.planets;
  }
  if (!enrichedAnalysis.dashas?.length && astrologyDoc?.dashas?.length) {
    enrichedAnalysis.dashas = astrologyDoc.dashas;
  }
  if (!enrichedAnalysis.yogas?.length && astrologyDoc?.yogas?.length) {
    enrichedAnalysis.yogas = astrologyDoc.yogas;
  }
  if (!enrichedAnalysis.astrologySummary && astrologyDoc?.careerHouseAnalysis) {
    enrichedAnalysis.astrologySummary = astrologyDoc.careerHouseAnalysis;
  }
  if (!enrichedAnalysis.palmistrySummary && palmistryDoc) {
    enrichedAnalysis.palmistrySummary = [
      palmistryDoc.fateLineAnalysis,
      palmistryDoc.headLineAnalysis,
      palmistryDoc.sunLineAnalysis,
    ].filter(Boolean).join(' ');
  }
  if (!enrichedAnalysis.faceSummary && faceDoc?.careerRecommendations) {
    enrichedAnalysis.faceSummary = faceDoc.careerRecommendations;
  }

  if (
    !enrichedAnalysis.synthesizedRecommendation &&
    !enrichedAnalysis.topCareerPaths?.length
  ) {
    const synthesized = await getOrBuildCareerInsight(userId);
    if (synthesized?.data) {
      Object.assign(enrichedAnalysis, {
        synthesizedRecommendation: enrichedAnalysis.synthesizedRecommendation || synthesized.data.synthesizedRecommendation,
        topCareerPaths: enrichedAnalysis.topCareerPaths?.length ? enrichedAnalysis.topCareerPaths : synthesized.data.topCareerPaths,
        strengthsSummary: enrichedAnalysis.strengthsSummary || synthesized.data.strengths,
        developmentAreas: enrichedAnalysis.developmentAreas || synthesized.data.challenges,
        confidenceScore: enrichedAnalysis.confidenceScore || synthesized.data.confidenceScore,
        threeYearPathway: enrichedAnalysis.threeYearPathway?.length ? enrichedAnalysis.threeYearPathway : synthesized.data.threeYearPathway,
      });
    }
  }

  const beforeCount = countImages(fullData);
  const afterCount = countImages(enrichedFullData);

  const userDetails = resolveUserDetails(user, astrologyDoc, enrichedFullData, bodyUserDetails);

  return {
    analysis: enrichedAnalysis,
    fullData: enrichedFullData,
    userDetails,
    sources: {
      insightFromDb: Boolean(insightDoc),
      palmistryReadingId: palmistryDoc?._id?.toString(),
      faceReadingId: faceDoc?._id?.toString(),
      astrologyReadingId: astrologyDoc?._id?.toString(),
      palmistryFromDb: hasValidImages(palmImages),
      faceFromDb: hasValidImages(faceImages),
      palmistryImageKeys: Object.keys(palmImages),
      faceImageKeys: Object.keys(faceImages),
    },
    imageCount: { before: beforeCount, after: afterCount },
  };
}

function countImages(fullData) {
  const images = collectAllImages(fullData || {});
  return [
    images.palmRight,
    images.palmLeft,
    images.palmBoth,
    images.faceCenter,
    images.faceLeft,
    images.faceRight,
    ...(images.extra || []).map((e) => e.url),
  ].filter(Boolean).length;
}

function formatBirthValue(val) {
  if (val == null || val === '') return null;
  if (typeof val === 'string') return val.trim();
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return val.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  return String(val);
}

/**
 * Merges birth details from User profile, astrology reading, birthChartData, and request body.
 */
function resolveUserDetails(user, astrologyDoc, fullData = {}, bodyUserDetails = {}) {
  const chart = astrologyDoc?.birthChartData || {};
  const astro = fullData?.astrology || {};

  const pick = (...values) => {
    for (const v of values) {
      const formatted = formatBirthValue(v);
      if (formatted) return formatted;
    }
    return null;
  };

  return {
    dateOfBirth: pick(
      bodyUserDetails.dateOfBirth,
      user?.dateOfBirth,
      astro.dateOfBirth,
      chart.dateOfBirth,
      chart.dob,
      chart.birthDate
    ),
    timeOfBirth: pick(
      bodyUserDetails.timeOfBirth,
      user?.timeOfBirth,
      astro.timeOfBirth,
      chart.timeOfBirth,
      chart.birthTime
    ),
    placeOfBirth: pick(
      bodyUserDetails.placeOfBirth,
      user?.placeOfBirth,
      astro.placeOfBirth,
      chart.placeOfBirth,
      chart.birthPlace,
      chart.city,
      chart.location
    ),
  };
}

module.exports = { enrichReportData, getOrBuildCareerInsight, resolveUserDetails };
