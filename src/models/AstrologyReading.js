const mongoose = require('mongoose');

const AstrologyReadingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  birthChartData: mongoose.Schema.Types.Mixed,
  careerHouseAnalysis: String,
  planetaryPeriods: [mongoose.Schema.Types.Mixed],
  careerRecommendations: String,
  favorablePeriods: [mongoose.Schema.Types.Mixed],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AstrologyReading', AstrologyReadingSchema);
