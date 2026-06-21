const PalmistryReading = require('../models/PalmistryReading');
const FaceReading = require('../models/FaceReading');
const AstrologyReading = require('../models/AstrologyReading');
const CareerInsight = require('../models/CareerInsight');
const {
  collectAllImages,
  isUsableImageSrc,
  extractImageString,
  normalizeToDataUrl,
  extractImagesFromReadingDoc,
} = require('./imageResolver');

function hasValidImages(images = {}) {
  return Object.values(images || {}).some((v) => isUsableImageSrc(v));
}

function mergeImageMaps(...sources) {
  const merged = {};
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;
    for (const [key, value] of Object.entries(source)) {
      const candidate = extractImageString(value);
      if (isUsableImageSrc(candidate)) {
        merged[key] = normalizeToDataUrl(candidate);
      }
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

async function findReadingWithImages(Model, userId, preferredId) {
  if (preferredId) {
    const linked = await Model.findById(preferredId).lean();
    if (linked && hasValidImages(linked.images)) return linked;
    if (linked) return linked;
  }

  const all = await Model.find({ user: userId }).sort({ createdAt: -1 }).lean();
  return all.find((doc) => hasValidImages(doc.images)) || all[0] || null;
}

async function getOrBuildCareerInsight(userId) {
  const insight = await CareerInsight.findOne({ user: userId }).sort({ createdAt: -1 }).lean();
  if (insight) {
    return { data: insight, synthesized: false };
  }

  const [astrologyDoc, palmistryDoc, faceDoc] = await Promise.all([
    AstrologyReading.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
    PalmistryReading.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
    FaceReading.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
  ]);

  if (!astrologyDoc && !palmistryDoc && !faceDoc) {
    return null;
  }

  const { synthesizeCareerInsight, isAiEnabled } = require('../services/aiReadingService');

  if (isAiEnabled() && astrologyDoc) {
    try {
      const aiSynthesis = await synthesizeCareerInsight({
        astrology: {
          lagna: astrologyDoc.birthChartData?.lagnaSign || astrologyDoc.ascendant,
          careerHouseAnalysis: astrologyDoc.careerHouseAnalysis,
          careerRecommendations: astrologyDoc.careerRecommendations,
          planets: astrologyDoc.planets || astrologyDoc.birthChartData?.planets,
          dashas: astrologyDoc.dashas || astrologyDoc.planetaryPeriods,
          yogas: astrologyDoc.yogas,
          favorablePeriods: astrologyDoc.favorablePeriods,
        },
        palmistry: palmistryDoc
          ? {
              fateLineAnalysis: palmistryDoc.fateLineAnalysis,
              headLineAnalysis: palmistryDoc.headLineAnalysis,
              sunLineAnalysis: palmistryDoc.sunLineAnalysis,
              careerRecommendations: palmistryDoc.careerRecommendations,
            }
          : null,
        face: faceDoc
          ? {
              personalityTraits: faceDoc.personalityTraits,
              careerRecommendations: faceDoc.careerRecommendations,
              leadershipScore: faceDoc.leadershipScore,
            }
          : null,
        userDetails: {
          gender: astrologyDoc.gender,
          dateOfBirth: astrologyDoc.dateOfBirth,
          placeOfBirth: astrologyDoc.placeOfBirth,
        },
      });

      if (aiSynthesis) {
        return {
          data: {
            astrologyReadingId: astrologyDoc?._id,
            palmistryReadingId: palmistryDoc?._id,
            faceReadingId: faceDoc?._id,
            synthesizedRecommendation: aiSynthesis.synthesizedRecommendation,
            topCareerPaths: aiSynthesis.topCareerPaths || [],
            strengths: aiSynthesis.strengths || [],
            challenges: aiSynthesis.challenges || [],
            confidenceScore: aiSynthesis.confidenceScore || 85,
            bestTiming: astrologyDoc?.favorablePeriods,
            sixMonthPathway: aiSynthesis.sixMonthPathway || [],
            threeYearPathway: aiSynthesis.threeYearPathway || [],
            aiGenerated: true,
          },
          synthesized: true,
        };
      }
    } catch (err) {
      console.warn('AI career synthesis failed, using rule-based merge:', err.message);
    }
  }

  const traits = typeof faceDoc?.personalityTraits === 'object' ? faceDoc.personalityTraits : {};
  const careerText = [
    palmistryDoc?.careerRecommendations,
    faceDoc?.careerRecommendations,
    astrologyDoc?.careerRecommendations,
  ].filter(Boolean);

  const astroPaths = astrologyDoc?.birthChartData?.careerPaths || astrologyDoc?.careerPaths;

  return {
    data: {
      astrologyReadingId: astrologyDoc?._id,
      palmistryReadingId: palmistryDoc?._id,
      faceReadingId: faceDoc?._id,
      synthesizedRecommendation: careerText.join(' ') || astroPaths?.[0]?.reasoning || null,
      topCareerPaths: astroPaths?.length
        ? astroPaths.map((p) => ({ title: p.title, match: p.match, reasoning: p.reasoning }))
        : careerText.map((title) => ({ title, reasoning: title })),
      strengths: traits.strengths || [],
      challenges: traits.challenges || [],
      confidenceScore:
        palmistryDoc?.confidenceScore || faceDoc?.confidenceScore || astrologyDoc?.confidenceScore || 85,
      bestTiming: astrologyDoc?.favorablePeriods,
      sixMonthPathway: [],
      threeYearPathway: [],
    },
    synthesized: true,
  };
}

/**
 * Loads the user's linked readings (via CareerInsight IDs) and merges images + analysis.
 */
const { SIGN_NAMES } = require('../services/vedicAstrologyConstants');
const { generateFullReading } = require('../services/vedicInterpretationEngine');

function hasChartPlanets(astro = {}) {
  return Boolean(astro.planets?.length || astro.birthChartData?.planets?.length);
}

function hasChartInterpretation(astro = {}) {
  const bcd = astro.birthChartData || {};
  return Boolean(
    astro.analysisParagraphs?.length ||
    astro.planetInterpretations?.length ||
    bcd.analysisParagraphs?.length ||
    bcd.planetInterpretations?.length ||
    astro.careerHouseAnalysis ||
    bcd.careerHouseAnalysis
  );
}

function parseDateParts(dateStr) {
  if (dateStr == null || dateStr === '') return null;
  if (typeof dateStr === 'object') {
    const day = Number(dateStr.day ?? dateStr.date?.day);
    const month = Number(dateStr.month ?? dateStr.date?.month);
    const year = Number(dateStr.year ?? dateStr.date?.year);
    if (day && month && year) return { day, month, year };
  }
  const trimmed = String(dateStr).trim();
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return { day: parsed.getDate(), month: parsed.getMonth() + 1, year: parsed.getFullYear() };
  }
  const dmy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) return { day: Number(dmy[1]), month: Number(dmy[2]), year: Number(dmy[3]) };
  return null;
}

function parseTimeParts(timeStr) {
  if (timeStr == null || timeStr === '') return { hour: 12, minute: 0 };
  if (typeof timeStr === 'object') {
    return {
      hour: Number(timeStr.hour ?? timeStr.hours ?? 12),
      minute: Number(timeStr.minute ?? timeStr.minutes ?? timeStr.min ?? 0),
    };
  }
  const match = String(timeStr).trim().match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?/i);
  if (!match) return { hour: 12, minute: 0 };
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const ampm = match[3]?.toLowerCase();
  if (ampm === 'pm' && hour < 12) hour += 12;
  if (ampm === 'am' && hour === 12) hour = 0;
  return { hour, minute };
}

function buildChartInputFromSources(userDetails = {}, astrologyDoc = null, bodyUserDetails = {}) {
  const bcd = astrologyDoc?.birthChartData || {};
  const birthInput = bcd.birthInput || {};
  const coords = bcd.coordinates || {};

  const dateParts =
    parseDateParts(
      birthInput.day != null
        ? { day: birthInput.day, month: birthInput.month, year: birthInput.year }
        : null
    ) ||
    parseDateParts(bodyUserDetails.dateOfBirth) ||
    parseDateParts(userDetails.dateOfBirth) ||
    parseDateParts(astrologyDoc?.dateOfBirth);

  if (!dateParts) return null;

  const timeParts =
    parseTimeParts(
      birthInput.hour != null
        ? { hour: birthInput.hour, minute: birthInput.minute ?? birthInput.min ?? 0 }
        : null
    ) ||
    parseTimeParts(bodyUserDetails.timeOfBirth) ||
    parseTimeParts(userDetails.timeOfBirth) ||
    parseTimeParts(astrologyDoc?.timeOfBirth);

  const place =
    birthInput.place ||
    bodyUserDetails.placeOfBirth ||
    userDetails.placeOfBirth ||
    astrologyDoc?.placeOfBirth ||
    null;

  const gender =
    birthInput.gender ||
    bodyUserDetails.gender ||
    userDetails.gender ||
    astrologyDoc?.gender ||
    null;

  return {
    day: dateParts.day,
    month: dateParts.month,
    year: dateParts.year,
    hour: timeParts.hour,
    minute: timeParts.minute,
    lat: Number(coords.lat ?? birthInput.lat ?? 25.42),
    lon: Number(coords.lon ?? birthInput.lon ?? 86.13),
    place,
    gender,
  };
}

function chartPayloadToAstrology(chart) {
  if (!chart) return {};
  return {
    planets: chart.planets,
    houses: chart.houses,
    dashas: chart.dashas,
    yogas: chart.yogas,
    chartSvg: chart.chartSvg,
    chartImageDataUrl: chart.chartImageDataUrl,
    ascendant: chart.ascendant || chart.lagna,
    lagna: chart.lagna || chart.ascendant,
    nakshatra: chart.nakshatra,
    careerHouseAnalysis: chart.careerHouseAnalysis,
    careerRecommendations: chart.careerRecommendations,
    favorablePeriods: chart.favorablePeriods,
    analysisParagraphs: chart.analysisParagraphs,
    planetInterpretations: chart.planetInterpretations,
    careerPaths: chart.careerPaths,
    birthChartData: chart.birthChartData,
  };
}

async function ensureAstrologyChartData(astrology = {}, userDetails = {}, astrologyDoc = null, bodyUserDetails = {}) {
  if (hasChartPlanets(astrology)) {
    return astrology;
  }

  const chartInput = buildChartInputFromSources(userDetails, astrologyDoc, bodyUserDetails);
  if (!chartInput) return astrology;

  try {
    const { generateVedicChart } = require('../services/vedicChartService');
    const chart = await generateVedicChart(chartInput);
    const generated = chartPayloadToAstrology(chart);

    if (astrologyDoc?._id && !hasChartPlanets(astrologyDoc)) {
      AstrologyReading.findByIdAndUpdate(astrologyDoc._id, {
        $set: {
          planets: generated.planets,
          houses: generated.houses,
          dashas: generated.dashas,
          yogas: generated.yogas,
          chartSvg: generated.chartSvg,
          chartImageDataUrl: generated.chartImageDataUrl,
          ascendant: generated.ascendant,
          lagna: generated.lagna,
          nakshatra: generated.nakshatra,
          careerHouseAnalysis: generated.careerHouseAnalysis,
          careerRecommendations: generated.careerRecommendations,
          favorablePeriods: generated.favorablePeriods,
          analysisParagraphs: generated.analysisParagraphs,
          planetInterpretations: generated.planetInterpretations,
          careerPaths: generated.careerPaths,
          birthChartData: generated.birthChartData,
          dateOfBirth: userDetails.dateOfBirth || astrologyDoc.dateOfBirth,
          timeOfBirth: userDetails.timeOfBirth || astrologyDoc.timeOfBirth,
          placeOfBirth: userDetails.placeOfBirth || astrologyDoc.placeOfBirth,
        },
      }).catch((err) => console.warn('[Report] Could not backfill astrology reading:', err.message));
    }

    return {
      ...astrology,
      ...generated,
      birthChartData: {
        ...(astrology.birthChartData || {}),
        ...(generated.birthChartData || {}),
      },
      analysisSource: chart.analysisSource || 'vedic-chart-regenerated',
    };
  } catch (err) {
    console.warn('[Report] Chart auto-regeneration failed:', err.message);
    return astrology;
  }
}

/**
 * Rebuilds per-chart interpretation from saved planetary positions when analysis text is missing.
 */
function hydrateChartAnalysis(astrologyDoc) {
  if (!astrologyDoc) return {};

  const bcd = astrologyDoc.birthChartData || {};
  const planets = astrologyDoc.planets?.length ? astrologyDoc.planets : (bcd.planets || []);
  if (!planets.length) return {};

  let lagnaSignIndex = bcd.lagnaSignIndex;
  const lagnaSign = bcd.lagnaSign || astrologyDoc.ascendant || astrologyDoc.lagna;
  if ((lagnaSignIndex == null || lagnaSignIndex < 0) && lagnaSign) {
    lagnaSignIndex = SIGN_NAMES.findIndex((s) => s.toLowerCase() === String(lagnaSign).toLowerCase());
  }
  if ((lagnaSignIndex == null || lagnaSignIndex < 0) && bcd.houses?.house_1) {
    lagnaSignIndex = SIGN_NAMES.findIndex(
      (s) => s.toLowerCase() === String(bcd.houses.house_1).toLowerCase()
    );
  }
  if (lagnaSignIndex == null || lagnaSignIndex < 0) {
    const ref = planets.find((p) => p.signIndex != null && p.house != null);
    if (ref) lagnaSignIndex = (ref.signIndex - (ref.house - 1) + 12) % 12;
  }
  if (lagnaSignIndex == null || lagnaSignIndex < 0) return {};

  const existingParagraphs = bcd.analysisParagraphs || astrologyDoc.analysisParagraphs;
  const existingPlanetInterp = bcd.planetInterpretations || astrologyDoc.planetInterpretations;
  if (existingParagraphs?.length && existingPlanetInterp?.length) return {};

  const dashas = astrologyDoc.dashas?.length
    ? astrologyDoc.dashas
    : (astrologyDoc.planetaryPeriods || bcd.dashas || []);
  const yogasRaw = astrologyDoc.yogas?.length ? astrologyDoc.yogas : (bcd.yogas || []);
  const yogas = Array.isArray(yogasRaw)
    ? yogasRaw.map((y) => (typeof y === 'string' ? y : y.description || y.name || '')).filter(Boolean)
    : [];

  const reading = generateFullReading({
    planets,
    lagnaSignIndex,
    lagnaSign: lagnaSign || SIGN_NAMES[lagnaSignIndex],
    lagnaDegree: bcd.lagnaDegree || 0,
    panchanga: bcd.panchanga || {
      nakshatra: { name: bcd.nakshatra || astrologyDoc.nakshatra, pada: bcd.nakshatraPada || bcd.pada },
    },
    dashas,
    yogas,
    gender: astrologyDoc.gender || bcd.birthInput?.gender,
  });

  return {
    analysisParagraphs: existingParagraphs?.length ? existingParagraphs : reading.paragraphs,
    planetInterpretations: existingPlanetInterp?.length ? existingPlanetInterp : reading.planetInterpretations,
    careerHouseAnalysis: astrologyDoc.careerHouseAnalysis || reading.careerHouseAnalysis,
    careerRecommendations: astrologyDoc.careerRecommendations || reading.careerRecommendations,
    careerPaths: bcd.careerPaths || astrologyDoc.careerPaths || reading.careerPaths,
    favorablePeriods: astrologyDoc.favorablePeriods?.length ? astrologyDoc.favorablePeriods : reading.favorablePeriods,
    dashaAnalysis: bcd.dashaAnalysis || reading.dashaAnalysis,
    analysisSource: 'vedic-chart-hydrated',
  };
}

function validatePersonalizedReport(enriched) {
  const astro = enriched.fullData?.astrology || {};
  const missing = [];
  if (!hasChartPlanets(astro)) {
    missing.push('calculated birth chart (complete astrology reading or save birth date/time/place on profile)');
  }
  if (hasChartPlanets(astro) && !hasChartInterpretation(astro)) {
    missing.push('chart interpretation (save your astrology reading after chart generation)');
  }
  return { ok: missing.length === 0, missing };
}

async function enrichReportData(userId, analysis = {}, fullData = {}, user = null, bodyUserDetails = {}) {
  const insightDoc = await CareerInsight.findOne({ user: userId }).sort({ createdAt: -1 }).lean();

  const [palmistryDoc, faceDoc, astrologyDoc] = await Promise.all([
    findReadingWithImages(PalmistryReading, userId, insightDoc?.palmistryReadingId),
    findReadingWithImages(FaceReading, userId, insightDoc?.faceReadingId),
    insightDoc?.astrologyReadingId
      ? AstrologyReading.findById(insightDoc.astrologyReadingId).lean()
      : AstrologyReading.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
  ]);

  const palmImages = mergeImageMaps(
    extractImagesFromReadingDoc(palmistryDoc),
    palmistryDoc?.images,
    fullData.palmistry?.images
  );
  const faceImages = mergeImageMaps(
    extractImagesFromReadingDoc(faceDoc),
    faceDoc?.images,
    fullData.face?.images
  );

  const enrichedFullData = {
    ...fullData,
    palmistry: {
      ...pickReadingFields(palmistryDoc, [
        'fateLineAnalysis',
        'headLineAnalysis',
        'sunLineAnalysis',
        'careerRecommendations',
        'confidenceScore',
      ]),
      ...(fullData.palmistry || {}),
      images: palmImages,
    },
    face: {
      ...pickReadingFields(faceDoc, [
        'personalityTraits',
        'leadershipScore',
        'teamworkScore',
        'independenceScore',
        'careerRecommendations',
        'confidenceScore',
      ]),
      ...(fullData.face || {}),
      images: faceImages,
    },
    astrology: {
      ...(astrologyDoc
        ? { ...astrologyDoc, _id: undefined, user: undefined, createdAt: undefined }
        : {}),
      ...(fullData.astrology || {}),
      planets: astrologyDoc?.planets?.length
        ? astrologyDoc.planets
        : (fullData.astrology?.planets || astrologyDoc?.birthChartData?.planets),
      houses: astrologyDoc?.houses || fullData.astrology?.houses || astrologyDoc?.birthChartData?.houses,
      dashas: astrologyDoc?.dashas?.length
        ? astrologyDoc.dashas
        : (fullData.astrology?.dashas || astrologyDoc?.planetaryPeriods),
      yogas: astrologyDoc?.yogas?.length
        ? astrologyDoc.yogas
        : fullData.astrology?.yogas,
      chartSvg: astrologyDoc?.chartSvg || astrologyDoc?.birthChartData?.chartSvg || fullData.astrology?.chartSvg,
      chartImageDataUrl:
        astrologyDoc?.chartImageDataUrl ||
        astrologyDoc?.birthChartData?.chartImageDataUrl ||
        fullData.astrology?.chartImageDataUrl,
      images: mergeImageMaps(astrologyDoc?.images, fullData.astrology?.images),
    },
  };

  const preliminaryUserDetails = resolveUserDetails(
    user,
    astrologyDoc,
    enrichedFullData,
    bodyUserDetails,
    analysis,
    fullData
  );

  enrichedFullData.astrology = await ensureAstrologyChartData(
    enrichedFullData.astrology,
    preliminaryUserDetails,
    astrologyDoc,
    bodyUserDetails
  );

  const chartHydration = hydrateChartAnalysis({
    ...(astrologyDoc || {}),
    ...enrichedFullData.astrology,
    birthChartData: {
      ...(astrologyDoc?.birthChartData || {}),
      ...(enrichedFullData.astrology.birthChartData || {}),
    },
  });
  if (Object.keys(chartHydration).length) {
    enrichedFullData.astrology = {
      ...enrichedFullData.astrology,
      ...chartHydration,
      birthChartData: {
        ...(astrologyDoc?.birthChartData || {}),
        ...(enrichedFullData.astrology.birthChartData || {}),
        ...chartHydration,
      },
    };
  }

  const enrichedAnalysis = {
    ...(insightDoc || {}),
    ...analysis,
  };

  if (!enrichedAnalysis.topCareerPaths?.length && insightDoc?.topCareerPaths?.length) {
    enrichedAnalysis.topCareerPaths = insightDoc.topCareerPaths;
  }
  if (!enrichedAnalysis.threeYearPathway?.length && insightDoc?.threeYearPathway?.length) {
    enrichedAnalysis.threeYearPathway = insightDoc.threeYearPathway;
  }
  if (!enrichedAnalysis.synthesizedRecommendation && insightDoc?.synthesizedRecommendation) {
    enrichedAnalysis.synthesizedRecommendation = insightDoc.synthesizedRecommendation;
  }
  if (!enrichedAnalysis.strengthsSummary?.length && !enrichedAnalysis.strengths?.length) {
    const traits = typeof faceDoc?.personalityTraits === 'object' ? faceDoc.personalityTraits : {};
    enrichedAnalysis.strengthsSummary = insightDoc?.strengths || traits.strengths || enrichedAnalysis.strengthsSummary;
  }
  if (!enrichedAnalysis.planets?.length && astrologyDoc?.planets?.length) {
    enrichedAnalysis.planets = astrologyDoc.planets;
  }
  if (!enrichedAnalysis.dashas?.length && astrologyDoc?.dashas?.length) {
    enrichedAnalysis.dashas = astrologyDoc.dashas;
  }
  if (!enrichedAnalysis.yogas?.length && astrologyDoc?.yogas?.length) {
    enrichedAnalysis.yogas = astrologyDoc.yogas;
  }
  if (!enrichedAnalysis.astrologySummary && (astrologyDoc?.careerHouseAnalysis || chartHydration.careerHouseAnalysis)) {
    enrichedAnalysis.astrologySummary = astrologyDoc?.careerHouseAnalysis || chartHydration.careerHouseAnalysis;
  }
  if (!enrichedAnalysis.topCareerPaths?.length && chartHydration.careerPaths?.length) {
    enrichedAnalysis.topCareerPaths = chartHydration.careerPaths;
  }
  if (!enrichedAnalysis.planets?.length && enrichedFullData.astrology?.planets?.length) {
    enrichedAnalysis.planets = enrichedFullData.astrology.planets;
  }
  if (!enrichedAnalysis.remedies?.length && astrologyDoc?.remedies?.length) {
    enrichedAnalysis.remedies = astrologyDoc.remedies;
  }
  if (!enrichedAnalysis.loveAnalysis && astrologyDoc?.loveAnalysis) {
    enrichedAnalysis.loveAnalysis = astrologyDoc.loveAnalysis;
  }
  if (!enrichedAnalysis.healthInsights && astrologyDoc?.healthInsights) {
    enrichedAnalysis.healthInsights = astrologyDoc.healthInsights;
  }
  if (!enrichedAnalysis.palmistrySummary && palmistryDoc) {
    enrichedAnalysis.palmistrySummary = [
      palmistryDoc.fateLineAnalysis,
      palmistryDoc.headLineAnalysis,
      palmistryDoc.sunLineAnalysis,
    ].filter(Boolean).join(' ');
  }
  if (!enrichedAnalysis.faceSummary && faceDoc?.careerRecommendations) {
    enrichedAnalysis.faceSummary = faceDoc.careerRecommendations;
  }

  if (
    !enrichedAnalysis.synthesizedRecommendation &&
    !enrichedAnalysis.topCareerPaths?.length
  ) {
    const synthesized = await getOrBuildCareerInsight(userId);
    if (synthesized?.data) {
      Object.assign(enrichedAnalysis, {
        synthesizedRecommendation: enrichedAnalysis.synthesizedRecommendation || synthesized.data.synthesizedRecommendation,
        topCareerPaths: enrichedAnalysis.topCareerPaths?.length ? enrichedAnalysis.topCareerPaths : synthesized.data.topCareerPaths,
        strengthsSummary: enrichedAnalysis.strengthsSummary || synthesized.data.strengths,
        developmentAreas: enrichedAnalysis.developmentAreas || synthesized.data.challenges,
        confidenceScore: enrichedAnalysis.confidenceScore || synthesized.data.confidenceScore,
        threeYearPathway: enrichedAnalysis.threeYearPathway?.length ? enrichedAnalysis.threeYearPathway : synthesized.data.threeYearPathway,
      });
    }
  }

  const beforeCount = countImages(fullData);
  const afterCount = countImages(enrichedFullData);

  const userDetails = resolveUserDetails(
    user,
    astrologyDoc,
    enrichedFullData,
    bodyUserDetails,
    enrichedAnalysis,
    fullData
  );

  return {
    analysis: enrichedAnalysis,
    fullData: enrichedFullData,
    userDetails,
    sources: {
      insightFromDb: Boolean(insightDoc),
      palmistryReadingId: palmistryDoc?._id?.toString(),
      faceReadingId: faceDoc?._id?.toString(),
      astrologyReadingId: astrologyDoc?._id?.toString(),
      palmistryFromDb: hasValidImages(palmImages),
      faceFromDb: hasValidImages(faceImages),
      palmistryImageKeys: Object.keys(palmImages),
      faceImageKeys: Object.keys(faceImages),
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

function formatBirthValue(val) {
  if (val == null || val === '') return null;
  if (typeof val === 'string') return val.trim();
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return val.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (typeof val === 'object') {
    const { day, month, year } = val;
    if (day != null && month != null && year != null) {
      const d = new Date(Number(year), Number(month) - 1, Number(day));
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
      }
    }
    if (val.formatted) return formatBirthValue(val.formatted);
    if (val.label) return formatBirthValue(val.label);
  }
  return String(val);
}

const DATE_KEYS = ['dateOfBirth', 'date_of_birth', 'dob', 'birthDate', 'birth_date', 'birthday'];
const TIME_KEYS = ['timeOfBirth', 'time_of_birth', 'birthTime', 'birth_time', 'time'];
const PLACE_KEYS = [
  'placeOfBirth',
  'place_of_birth',
  'birthPlace',
  'birth_place',
  'birthLocation',
  'birth_location',
  'city',
  'location',
];

const GENDER_KEYS = ['gender', 'sex', 'userGender'];

const GENDER_LABELS = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  'prefer not to say': 'Prefer not to say',
  'prefer_not_to_say': 'Prefer not to say',
};

function formatGenderValue(val) {
  if (val == null || val === '') return null;
  const raw = String(val).trim();
  if (!raw) return null;
  const normalized = raw.toLowerCase().replace(/_/g, ' ');
  return GENDER_LABELS[normalized] || raw.charAt(0).toUpperCase() + raw.slice(1);
}

function collectBirthValues(obj, depth = 0, visited = new WeakSet()) {
  const dates = [];
  const times = [];
  const places = [];
  const genders = [];

  if (!obj || typeof obj !== 'object' || depth > 5) {
    return { dates, times, places, genders };
  }
  if (visited.has(obj)) return { dates, times, places, genders };
  visited.add(obj);

  for (const key of DATE_KEYS) {
    if (obj[key] != null && obj[key] !== '') dates.push(obj[key]);
  }
  if (obj.day != null && obj.month != null && obj.year != null) {
    dates.push({ day: obj.day, month: obj.month, year: obj.year });
  }

  for (const key of TIME_KEYS) {
    if (obj[key] != null && obj[key] !== '') times.push(obj[key]);
  }

  for (const key of PLACE_KEYS) {
    if (obj[key] != null && obj[key] !== '') places.push(obj[key]);
  }

  for (const key of GENDER_KEYS) {
    if (obj[key] != null && obj[key] !== '') genders.push(obj[key]);
  }

  const nestedKeys = [
    'birthChartData',
    'birthDetails',
    'birthInfo',
    'userDetails',
    'astrology',
    'birthData',
    'profile',
    'input',
    'formData',
  ];
  for (const key of nestedKeys) {
    if (obj[key] && typeof obj[key] === 'object') {
      const nested = collectBirthValues(obj[key], depth + 1, visited);
      dates.push(...nested.dates);
      times.push(...nested.times);
      places.push(...nested.places);
      genders.push(...nested.genders);
    }
  }

  return { dates, times, places, genders };
}

function pickFirstFormatted(values) {
  for (const v of values) {
    const formatted = formatBirthValue(v);
    if (formatted) return formatted;
  }
  return null;
}

function collectBodyUserDetails(body = {}) {
  return {
    ...(body.userDetails || {}),
    ...(body.birthDetails || {}),
    gender: body.gender ?? body.userDetails?.gender ?? body.birthDetails?.gender,
    dateOfBirth: body.dateOfBirth ?? body.userDetails?.dateOfBirth ?? body.birthDetails?.dateOfBirth,
    timeOfBirth: body.timeOfBirth ?? body.userDetails?.timeOfBirth ?? body.birthDetails?.timeOfBirth,
    placeOfBirth: body.placeOfBirth ?? body.userDetails?.placeOfBirth ?? body.birthDetails?.placeOfBirth,
  };
}

/**
 * Merges birth details from request body, analysis, fullData, saved readings, and user profile.
 */
function resolveUserDetails(
  user,
  astrologyDoc,
  enrichedFullData = {},
  bodyUserDetails = {},
  analysis = {},
  requestFullData = {}
) {
  const dateCandidates = [];
  const timeCandidates = [];
  const placeCandidates = [];
  const genderCandidates = [];

  const addSource = (...sources) => {
    for (const source of sources) {
      if (!source) continue;
      const collected = collectBirthValues(source);
      dateCandidates.push(...collected.dates);
      timeCandidates.push(...collected.times);
      placeCandidates.push(...collected.places);
      genderCandidates.push(...collected.genders);
    }
  };

  // Highest priority: explicit values from the current report/download request
  addSource(bodyUserDetails, analysis, requestFullData, requestFullData?.astrology);
  // Then enriched payload and saved astrology reading from DB
  addSource(enrichedFullData, enrichedFullData?.astrology, astrologyDoc, astrologyDoc?.birthChartData);
  // Finally user profile (synced when astrology reading is saved)
  addSource(user);

  return {
    gender: genderCandidates.map(formatGenderValue).find(Boolean) || null,
    dateOfBirth: pickFirstFormatted(dateCandidates),
    timeOfBirth: pickFirstFormatted(timeCandidates),
    placeOfBirth: pickFirstFormatted(placeCandidates),
  };
}

async function syncUserBirthDetails(userId, details) {
  if (!userId || !details) return;
  const updates = {};
  if (details.gender) updates.gender = details.gender;
  if (details.dateOfBirth) updates.dateOfBirth = details.dateOfBirth;
  if (details.timeOfBirth) updates.timeOfBirth = details.timeOfBirth;
  if (details.placeOfBirth) updates.placeOfBirth = details.placeOfBirth;
  if (!Object.keys(updates).length) return;

  const User = require('../models/User');
  await User.findByIdAndUpdate(userId, updates);
}

module.exports = {
  enrichReportData,
  getOrBuildCareerInsight,
  resolveUserDetails,
  collectBodyUserDetails,
  syncUserBirthDetails,
  formatGenderValue,
  hydrateChartAnalysis,
  validatePersonalizedReport,
  ensureAstrologyChartData,
};
