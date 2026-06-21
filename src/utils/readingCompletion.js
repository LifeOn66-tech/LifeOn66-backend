const AstrologyReading = require('../models/AstrologyReading');
const PalmistryReading = require('../models/PalmistryReading');
const FaceReading = require('../models/FaceReading');
const User = require('../models/User');

const READING_LABELS = {
  astrology: 'Vedic Astrology',
  palmistry: 'Palm Reading',
  face: 'Face Reading',
};

function hasSavedChartData(astrologyDoc) {
  if (!astrologyDoc) return false;
  return Boolean(
    astrologyDoc.planets?.length ||
    astrologyDoc.birthChartData?.planets?.length
  );
}

function hasRegeneratableBirthDetails(astrologyDoc, user) {
  const bcd = astrologyDoc?.birthChartData || {};
  const birthInput = bcd.birthInput || bcd.birthDetails || {};
  const hasBirthInput = birthInput.day != null && birthInput.month != null && birthInput.year != null;
  const hasProfileBirth =
    Boolean(user?.dateOfBirth) ||
    Boolean(astrologyDoc?.dateOfBirth) ||
    Boolean(birthInput.day != null);
  return hasBirthInput || hasProfileBirth;
}

async function getReadingCompletionStatus(userId) {
  const [astrologyDoc, hasPalmistry, hasFace, user] = await Promise.all([
    AstrologyReading.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
    PalmistryReading.exists({ user: userId }),
    FaceReading.exists({ user: userId }),
    User.findById(userId).select('dateOfBirth timeOfBirth placeOfBirth').lean(),
  ]);

  const hasAstrology = Boolean(astrologyDoc);
  const hasChartData = hasSavedChartData(astrologyDoc);
  const canRegenerateChart = hasRegeneratableBirthDetails(astrologyDoc, user);
  const astrologyComplete = hasAstrology && (hasChartData || canRegenerateChart);

  const missing = [];
  if (!hasAstrology) missing.push(READING_LABELS.astrology);
  else if (!astrologyComplete) {
    missing.push(`${READING_LABELS.astrology} (birth chart with date, time, and place)`);
  }
  if (!hasPalmistry) missing.push(READING_LABELS.palmistry);
  if (!hasFace) missing.push(READING_LABELS.face);

  const completedCount = [astrologyComplete, hasPalmistry, hasFace].filter(Boolean).length;

  return {
    complete: missing.length === 0,
    astrology: astrologyComplete,
    astrologySaved: hasAstrology,
    astrologyHasChart: hasChartData,
    palmistry: Boolean(hasPalmistry),
    face: Boolean(hasFace),
    missing,
    completedCount,
    totalRequired: 3,
  };
}

function buildIncompleteReadingsMessage(status) {
  if (status.complete) return null;
  return `Please complete all readings before purchasing a paid plan. Missing: ${status.missing.join(', ')}.`;
}

module.exports = {
  getReadingCompletionStatus,
  buildIncompleteReadingsMessage,
  READING_LABELS,
  hasSavedChartData,
};
