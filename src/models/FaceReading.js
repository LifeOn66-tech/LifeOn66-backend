const mongoose = require('mongoose');

const FaceReadingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  images: {
    center: String,
    left: String,
    right: String
  },
  personalityTraits: mongoose.Schema.Types.Mixed,
  leadershipScore: Number,
  teamworkScore: Number,
  independenceScore: Number,
  careerRecommendations: String,
  confidenceScore: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('FaceReading', FaceReadingSchema);
