const mongoose = require('mongoose');

const AstrologyReadingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  birthChartData: mongoose.Schema.Types.Mixed,
  planets: [mongoose.Schema.Types.Mixed],
  houses: mongoose.Schema.Types.Mixed,
  dashas: [mongoose.Schema.Types.Mixed],
  yogas: [mongoose.Schema.Types.Mixed],
  chartSvg: String,
  chartImageDataUrl: String,
  gender: String,
  dateOfBirth: String,
  timeOfBirth: String,
  placeOfBirth: String,
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
