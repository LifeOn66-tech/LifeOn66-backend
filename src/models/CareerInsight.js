const mongoose = require('mongoose');

const CareerInsightSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  astrologyReadingId: {
    type: mongoose.Schema.ObjectId,
    ref: 'AstrologyReading'
  },
  palmistryReadingId: {
    type: mongoose.Schema.ObjectId,
    ref: 'PalmistryReading'
  },
  faceReadingId: {
    type: mongoose.Schema.ObjectId,
    ref: 'FaceReading'
  },
  synthesizedRecommendation: String,
  topCareerPaths: [mongoose.Schema.Types.Mixed],
  bestTiming: mongoose.Schema.Types.Mixed,
  strengths: [mongoose.Schema.Types.Mixed],
  challenges: [mongoose.Schema.Types.Mixed],
  actionItems: [mongoose.Schema.Types.Mixed],
  sixMonthPathway: [mongoose.Schema.Types.Mixed],
  threeYearPathway: [mongoose.Schema.Types.Mixed],
  confidenceScore: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CareerInsight', CareerInsightSchema);
