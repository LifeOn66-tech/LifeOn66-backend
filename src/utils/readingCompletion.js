const AstrologyReading = require('../models/AstrologyReading');
const PalmistryReading = require('../models/PalmistryReading');
const FaceReading = require('../models/FaceReading');

const READING_LABELS = {
  astrology: 'Vedic Astrology',
  palmistry: 'Palm Reading',
  face: 'Face Reading',
};

async function getReadingCompletionStatus(userId) {
  const [hasAstrology, hasPalmistry, hasFace] = await Promise.all([
    AstrologyReading.exists({ user: userId }),
    PalmistryReading.exists({ user: userId }),
    FaceReading.exists({ user: userId }),
  ]);

  const missing = [];
  if (!hasAstrology) missing.push(READING_LABELS.astrology);
  if (!hasPalmistry) missing.push(READING_LABELS.palmistry);
  if (!hasFace) missing.push(READING_LABELS.face);

  const completedCount = [hasAstrology, hasPalmistry, hasFace].filter(Boolean).length;

  return {
    complete: missing.length === 0,
    astrology: Boolean(hasAstrology),
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
};
