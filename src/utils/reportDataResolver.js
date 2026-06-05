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
async function enrichReportData(userId, analysis = {}, fullData = {}) {
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

  const beforeCount = countImages(fullData);
  const afterCount = countImages(enrichedFullData);

  return {
    analysis: enrichedAnalysis,
    fullData: enrichedFullData,
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

module.exports = { enrichReportData, getOrBuildCareerInsight };
