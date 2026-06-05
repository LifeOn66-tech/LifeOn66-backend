const PalmistryReading = require('../models/PalmistryReading');
const FaceReading = require('../models/FaceReading');
const AstrologyReading = require('../models/AstrologyReading');
const CareerInsight = require('../models/CareerInsight');
const { collectAllImages, isUsableImageSrc, extractImageString } = require('./imageResolver');

function mergeImageMaps(dbImages = {}, requestImages = {}) {
  const merged = { ...(dbImages || {}) };
  if (!requestImages || typeof requestImages !== 'object') return merged;

  for (const [key, value] of Object.entries(requestImages)) {
    const candidate = extractImageString(value);
    if (isUsableImageSrc(candidate)) {
      merged[key] = candidate;
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

/**
 * Merges request payload with the user's latest saved readings from MongoDB.
 * Images live on reading documents as base64 data URLs or remote URLs — not Cloudinary.
 */
async function enrichReportData(userId, analysis = {}, fullData = {}) {
  const [palmistryDoc, faceDoc, astrologyDoc, insightDoc] = await Promise.all([
    PalmistryReading.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
    FaceReading.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
    AstrologyReading.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
    CareerInsight.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
  ]);

  const palmistryFromDb = pickReadingFields(palmistryDoc, [
    'fateLineAnalysis',
    'headLineAnalysis',
    'sunLineAnalysis',
    'careerRecommendations',
    'confidenceScore',
  ]);
  const faceFromDb = pickReadingFields(faceDoc, [
    'personalityTraits',
    'leadershipScore',
    'teamworkScore',
    'independenceScore',
    'careerRecommendations',
    'confidenceScore',
  ]);
  const astrologyFromDb = astrologyDoc
    ? { ...astrologyDoc, _id: undefined, user: undefined, createdAt: undefined }
    : {};

  const enrichedFullData = {
    ...fullData,
    palmistry: {
      ...palmistryFromDb,
      ...(fullData.palmistry || {}),
      images: mergeImageMaps(palmistryDoc?.images, fullData.palmistry?.images),
    },
    face: {
      ...faceFromDb,
      ...(fullData.face || {}),
      images: mergeImageMaps(faceDoc?.images, fullData.face?.images),
    },
    astrology: {
      ...astrologyFromDb,
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
      palmistryFromDb: Boolean(palmistryDoc?.images && Object.values(palmistryDoc.images).some(isUsableImageSrc)),
      faceFromDb: Boolean(faceDoc?.images && Object.values(faceDoc.images).some(isUsableImageSrc)),
      astrologyFromDb: Boolean(astrologyDoc),
      insightFromDb: Boolean(insightDoc),
      palmistryImageKeys: palmistryDoc?.images ? Object.keys(palmistryDoc.images).filter((k) => isUsableImageSrc(palmistryDoc.images[k])) : [],
      faceImageKeys: faceDoc?.images ? Object.keys(faceDoc.images).filter((k) => isUsableImageSrc(faceDoc.images[k])) : [],
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

module.exports = { enrichReportData };
