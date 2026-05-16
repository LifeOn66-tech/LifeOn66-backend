const mongoose = require('mongoose');

const PalmistryReadingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  images: {
    left: String,
    right: String,
    both: String
  },
  fateLineAnalysis: String,
  headLineAnalysis: String,
  sunLineAnalysis: String,
  careerRecommendations: String,
  confidenceScore: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PalmistryReading', PalmistryReadingSchema);
