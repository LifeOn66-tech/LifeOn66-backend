const AstrologyReading = require('../models/AstrologyReading');
const PalmistryReading = require('../models/PalmistryReading');
const FaceReading = require('../models/FaceReading');
const CareerInsight = require('../models/CareerInsight');
const { normalizeReadingImages } = require('../utils/imageResolver');
const {
  getOrBuildCareerInsight,
  resolveUserDetails,
  syncUserBirthDetails,
  formatGenderValue,
} = require('../utils/reportDataResolver');

// @desc    Save astrology reading
// @route   POST /api/readings/astrology
// @access  Private
exports.saveAstrologyReading = async (req, res) => {
  try {
    req.body.user = req.user.id;

    const gender =
      req.body.gender ||
      req.body.birthDetails?.gender ||
      req.body.birthData?.gender ||
      req.body.userDetails?.gender;
    if (gender) req.body.gender = formatGenderValue(gender) || String(gender).trim();

    const reading = await AstrologyReading.create(req.body);

    const birthDetails = resolveUserDetails(
      null,
      reading,
      { astrology: reading, ...req.body },
      req.body.userDetails || req.body.birthDetails || {},
      req.body,
      req.body
    );
    await syncUserBirthDetails(req.user.id, birthDetails);

    res.status(201).json({ success: true, data: reading });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Save palmistry reading
// @route   POST /api/readings/palmistry
// @access  Private
exports.savePalmistryReading = async (req, res) => {
  try {
    req.body.user = req.user.id;
    if (req.body.images) {
      req.body.images = normalizeReadingImages(req.body.images);
    }
    const reading = await PalmistryReading.create(req.body);
    res.status(201).json({ success: true, data: reading });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Save face reading
// @route   POST /api/readings/face
// @access  Private
exports.saveFaceReading = async (req, res) => {
  try {
    req.body.user = req.user.id;
    if (req.body.images) {
      req.body.images = normalizeReadingImages(req.body.images);
    }
    const reading = await FaceReading.create(req.body);
    res.status(201).json({ success: true, data: reading });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Save career insight
// @route   POST /api/readings/insight
// @access  Private
exports.saveCareerInsight = async (req, res) => {
  try {
    req.body.user = req.user.id;
    const reading = await CareerInsight.create(req.body);
    res.status(201).json({ success: true, data: reading });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get latest career insight
// @route   GET /api/readings/insight
// @access  Private
exports.getCareerInsight = async (req, res) => {
  try {
    const result = await getOrBuildCareerInsight(req.user.id);

    if (!result) {
      return res.status(200).json({
        success: true,
        synthesized: true,
        data: {
          synthesizedRecommendation:
            'Complete your astrology, palmistry, and face readings for a fully personalized report.',
          confidenceScore: 80,
          topCareerPaths: [],
          strengths: [],
        },
      });
    }

    res.status(200).json({
      success: true,
      synthesized: result.synthesized,
      data: result.data,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get all readings for user
// @route   GET /api/readings
// @access  Private
exports.getReadings = async (req, res) => {
  try {
    const astrology = await AstrologyReading.find({ user: req.user.id });
    const palmistry = await PalmistryReading.find({ user: req.user.id });
    const face = await FaceReading.find({ user: req.user.id });
    const insights = await CareerInsight.find({ user: req.user.id });

    res.status(200).json({
      success: true,
      data: {
        astrology,
        palmistry,
        face,
        insights
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Generate astrology reading (Mock)
// @route   POST /api/readings/astrology-generate
// @access  Public
exports.generateAstrologyData = async (req, res) => {
  try {
    const apiData = {
      planets: [
        { planet: 'Sun', sign: 'Leo', house: 10, degree: 15 },
        { planet: 'Moon', sign: 'Cancer', house: 9, degree: 22 },
        { planet: 'Mars', sign: 'Aries', house: 1, degree: 5 },
        { planet: 'Mercury', sign: 'Virgo', house: 11, degree: 12 },
        { planet: 'Jupiter', sign: 'Sagittarius', house: 2, degree: 18 },
        { planet: 'Venus', sign: 'Taurus', house: 6, degree: 25 },
        { planet: 'Saturn', sign: 'Capricorn', house: 3, degree: 9 },
        { planet: 'Rahu', sign: 'Gemini', house: 8, degree: 14 },
        { planet: 'Ketu', sign: 'Sagittarius', house: 2, degree: 14 }
      ],
      careerHouse: 'Strong 10th house indicating high professional status and leadership.',
      favorablePeriods: ['2026-2028: Major expansion', '2030-2035: Peak recognition'],
      careerRecommendations: 'Politics, Executive Management, or Entrepreneurship',
      houses: { house_1: 'Aries', house_10: 'Capricorn' },
      dashas: [
        { planet: 'Jupiter', period: '2024-2040', effect: 'Expansion and wealth' }
      ],
      yogas: ['Gaja Kesari Yoga: Wealth and intelligence']
    };

    res.status(200).json(apiData);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

