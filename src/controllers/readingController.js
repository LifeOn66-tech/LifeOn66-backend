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

    const bcd = req.body.birthChartData || {};
    const copyIfMissing = (field) => {
      if (bcd[field] != null && req.body[field] == null) req.body[field] = bcd[field];
    };

    copyIfMissing('chartSvg');
    copyIfMissing('chartImageDataUrl');
    copyIfMissing('planets');
    copyIfMissing('houses');
    copyIfMissing('yogas');
    copyIfMissing('ascendant');
    copyIfMissing('lagna');
    copyIfMissing('nakshatra');
    copyIfMissing('planetInterpretations');
    copyIfMissing('analysisParagraphs');
    copyIfMissing('careerPaths');
    copyIfMissing('favorablePeriods');
    copyIfMissing('careerHouseAnalysis');
    copyIfMissing('careerRecommendations');

    if (!req.body.planets?.length && bcd.planets?.length) req.body.planets = bcd.planets;
    if (!req.body.houses && bcd.houses) req.body.houses = bcd.houses;
    if (!req.body.dashas?.length && req.body.planetaryPeriods?.length) {
      req.body.dashas = req.body.planetaryPeriods;
    }
    if (!req.body.dashas?.length && bcd.dashas?.length) req.body.dashas = bcd.dashas;
    if (!req.body.birthChartData && req.body.planets?.length) {
      req.body.birthChartData = {
        ...bcd,
        planets: req.body.planets,
        houses: req.body.houses,
        chartSvg: req.body.chartSvg,
        chartImageDataUrl: req.body.chartImageDataUrl,
        planetInterpretations: req.body.planetInterpretations,
        analysisParagraphs: req.body.analysisParagraphs,
      };
    }

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

// @desc    Analyze palm images with AI vision (real palmistry)
// @route   POST /api/readings/palmistry-analyze
// @access  Private
exports.analyzePalmistry = async (req, res) => {
  const images = normalizeReadingImages(req.body.images || req.body);
  const userContext = {
    gender: req.body.gender,
    name: req.user?.name,
    hand: req.body.hand || 'both',
  };

  try {
    const { analyzePalm } = require('../services/palmAnalysisService');
    const analysis = await analyzePalm(images, userContext);

    res.status(200).json({
      success: true,
      data: analysis,
      aiGenerated: Boolean(analysis.aiGenerated),
      degraded: Boolean(analysis.degraded),
      fallbackReason: analysis.fallbackReason || null,
    });
  } catch (err) {
    console.error('Palm analysis failed:', err);
    const { buildPalmRuleBasedFallback } = require('../services/ruleBasedReadingFallback');
    const fallback = buildPalmRuleBasedFallback(images, userContext);
    res.status(200).json({
      success: true,
      data: fallback,
      aiGenerated: false,
      degraded: true,
      fallbackReason: 'error',
      warning: err.message,
    });
  }
};

// @desc    Analyze face images with AI vision (real physiognomy)
// @route   POST /api/readings/face-analyze
// @access  Private
exports.analyzeFace = async (req, res) => {
  const images = normalizeReadingImages(req.body.images || req.body);
  const userContext = {
    gender: req.body.gender,
    name: req.user?.name,
  };

  try {
    const { analyzeFace } = require('../services/faceAnalysisService');
    const analysis = await analyzeFace(images, userContext);

    res.status(200).json({
      success: true,
      data: analysis,
      aiGenerated: Boolean(analysis.aiGenerated),
      degraded: Boolean(analysis.degraded),
      fallbackReason: analysis.fallbackReason || null,
    });
  } catch (err) {
    console.error('Face analysis failed:', err);
    const { buildFaceRuleBasedFallback } = require('../services/ruleBasedReadingFallback');
    const fallback = buildFaceRuleBasedFallback(images, userContext);
    res.status(200).json({
      success: true,
      data: fallback,
      aiGenerated: false,
      degraded: true,
      fallbackReason: 'error',
      warning: err.message,
    });
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

// @desc    Generate personalized Vedic birth chart (North Indian)
// @route   POST /api/readings/astrology-generate
// @access  Public
exports.generateAstrologyData = async (req, res) => {
  try {
    const { generateVedicChart } = require('../services/vedicChartService');
    const chart = await generateVedicChart(req.body);

    res.status(200).json({
      planets: chart.planets,
      houses: chart.houses,
      dashas: chart.dashas,
      yogas: chart.yogas,
      careerHouse: chart.careerHouseAnalysis,
      careerRecommendations: chart.careerRecommendations,
      favorablePeriods: chart.favorablePeriods,
      ascendant: chart.ascendant,
      lagna: chart.lagna,
      nakshatra: chart.nakshatra,
      pada: chart.pada,
      chartSvg: chart.chartSvg,
      chartImageDataUrl: chart.chartImageDataUrl,
      birthChartData: chart.birthChartData,
      analysisParagraphs: chart.analysisParagraphs,
      careerPaths: chart.careerPaths,
      planetInterpretations: chart.planetInterpretations,
      aiEnhanced: chart.aiEnhanced,
      analysisSource: chart.analysisSource,
    });
  } catch (err) {
    console.error('Vedic chart generation failed:', err);
    res.status(400).json({ success: false, error: err.message || 'Failed to generate birth chart.' });
  }
};

