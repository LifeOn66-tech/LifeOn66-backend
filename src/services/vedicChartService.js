const { NodeJHora } = require('@node-jhora/core');
const {
  SIGN_NAMES,
  NAKSHATRA_LORDS,
  DASHA_SEQUENCE,
  DASHA_YEARS,
  EXALTATION,
  DEBILITATION,
  SIGN_LORDS,
  KENDRA_HOUSES,
} = require('./vedicAstrologyConstants');
const { renderNorthIndianChart, svgToDataUrl } = require('./northIndianChartRenderer');
const { generateFullReading } = require('./vedicInterpretationEngine');
const { generateAstrologyNarrative, isAiEnabled } = require('./aiReadingService');

let engineReady = false;

function normalize360(lon) {
  let v = lon % 360;
  if (v < 0) v += 360;
  return v;
}

function longitudeToSignIndex(lon) {
  return Math.floor(normalize360(lon) / 30);
}

function getDegreeInSign(lon) {
  return normalize360(lon) % 30;
}

function getTimezoneOffsetMinutes(lat, lon) {
  if (lat >= 6 && lat <= 37 && lon >= 68 && lon <= 97) return 330;
  if (lat >= 24 && lat <= 49 && lon >= -125 && lon <= -66) {
    const isDST = false;
    return isDST ? -240 : -300;
  }
  return Math.round((lon / 15) * 60);
}

function parseBirthInput(input = {}) {
  const birth = input.birthData || input;
  const day = Number(birth.day ?? birth.date?.day);
  const month = Number(birth.month ?? birth.date?.month);
  const year = Number(birth.year ?? birth.date?.year);
  const hour = Number(birth.hour ?? birth.hours ?? 12);
  const minute = Number(birth.min ?? birth.minute ?? birth.minutes ?? 0);
  const lat = Number(birth.lat ?? birth.latitude ?? 28.6139);
  const lon = Number(birth.lon ?? birth.longitude ?? 77.209);
  const gender = birth.gender || input.gender || null;
  const place = birth.place || birth.placeOfBirth || input.placeOfBirth || null;

  if (!day || !month || !year) {
    throw new Error('Birth date (day, month, year) is required for chart calculation.');
  }

  const offsetMin = getTimezoneOffsetMinutes(lat, lon);
  const utcMs = Date.UTC(year, month - 1, day, hour, minute) - offsetMin * 60 * 1000;
  const birthUtc = new Date(utcMs);

  return { day, month, year, hour, minute, lat, lon, gender, place, birthUtc };
}

async function ensureEngine() {
  if (!engineReady) {
    await NodeJHora.init();
    engineReady = true;
  }
}

function getPlanetHouse(planetSignIndex, lagnaSignIndex) {
  return ((planetSignIndex - lagnaSignIndex + 12) % 12) + 1;
}

function getHouseSignName(houseNum, lagnaSignIndex) {
  return SIGN_NAMES[(lagnaSignIndex + houseNum - 1) % 12];
}

function buildPlanetRecord(name, longitude, speed, lagnaSignIndex) {
  const signIndex = longitudeToSignIndex(longitude);
  const sign = SIGN_NAMES[signIndex];
  const house = getPlanetHouse(signIndex, lagnaSignIndex);
  const degreeInSign = Math.round(getDegreeInSign(longitude) * 100) / 100;
  const retrograde = speed < 0 || name === 'Rahu' || name === 'Ketu';
  const exalted = EXALTATION[name] === sign;
  const debilitated = DEBILITATION[name] === sign;

  return {
    planet: name,
    name,
    sign,
    signIndex,
    house,
    degree: Math.round(degreeInSign),
    degreeInSign,
    longitude: normalize360(longitude),
    retrograde,
    exalted,
    debilitated,
    combust: false,
  };
}

function markCombust(planets) {
  const sun = planets.find((p) => p.planet === 'Sun');
  if (!sun) return;
  for (const p of planets) {
    if (['Mercury', 'Venus'].includes(p.planet)) {
      const dist = Math.abs(normalize360(p.longitude) - normalize360(sun.longitude));
      const shortest = dist > 180 ? 360 - dist : dist;
      if (shortest <= (p.planet === 'Mercury' ? 14 : 10)) p.combust = true;
    }
  }
}

function calculateVimshottariDasha(moonLongitude, birthDate) {
  const nakshatraIndex = Math.floor(normalize360(moonLongitude) / (360 / 27));
  const nakshatraSpan = 360 / 27;
  const traversed = normalize360(moonLongitude) - nakshatraIndex * nakshatraSpan;
  const remainingFraction = 1 - traversed / nakshatraSpan;

  const startLord = NAKSHATRA_LORDS[nakshatraIndex];
  const startLordYears = DASHA_YEARS[startLord];
  const balanceYears = remainingFraction * startLordYears;

  const dashas = [];
  let cursor = new Date(birthDate);
  let lordIdx = DASHA_SEQUENCE.indexOf(startLord);

  const firstEnd = new Date(cursor);
  firstEnd.setFullYear(firstEnd.getFullYear() + Math.floor(balanceYears));
  firstEnd.setMonth(firstEnd.getMonth() + Math.round((balanceYears % 1) * 12));

  dashas.push({
    planet: startLord,
    period: `${cursor.getFullYear()}–${firstEnd.getFullYear()}`,
    effect: '',
    isCurrent: new Date() >= cursor && new Date() <= firstEnd,
  });

  cursor = firstEnd;
  lordIdx = (lordIdx + 1) % 9;

  for (let i = 0; i < 8; i += 1) {
    const lord = DASHA_SEQUENCE[lordIdx];
    const years = DASHA_YEARS[lord];
    const end = new Date(cursor);
    end.setFullYear(end.getFullYear() + years);
    const now = new Date();
    dashas.push({
      planet: lord,
      period: `${cursor.getFullYear()}–${end.getFullYear()}`,
      effect: '',
      isCurrent: now >= cursor && now < end,
    });
    cursor = end;
    lordIdx = (lordIdx + 1) % 9;
  }

  return dashas;
}

function detectYogas(planets, lagnaSignIndex) {
  const yogas = [];
  const byName = Object.fromEntries(planets.map((p) => [p.planet, p]));
  const moon = byName.Moon;
  const jupiter = byName.Jupiter;
  const sun = byName.Sun;
  const mercury = byName.Mercury;
  const mars = byName.Mars;
  const venus = byName.Venus;
  const saturn = byName.Saturn;

  if (moon && jupiter) {
    const diff = Math.abs(moon.house - jupiter.house);
    const kendra = diff === 0 || diff === 3 || diff === 6 || diff === 9;
    if (kendra) yogas.push('Gaja Kesari Yoga: Jupiter in Kendra from Moon — intelligence, reputation, and leadership capacity.');
  }

  if (sun && mercury && sun.sign === mercury.sign) {
    yogas.push('Budha-Aditya Yoga: Sun-Mercury conjunction — sharp intellect, communication mastery, and administrative skill.');
  }

  const tenthSign = getHouseSignName(10, lagnaSignIndex);
  const tenthLord = SIGN_LORDS[tenthSign];
  const tenthLordPlanet = byName[tenthLord];
  if (tenthLordPlanet && KENDRA_HOUSES.includes(tenthLordPlanet.house)) {
    yogas.push(`Raj Yoga indicator: 10th lord ${tenthLord} placed in Kendra (House ${tenthLordPlanet.house}) — authority and public recognition potential.`);
  }

  if (jupiter && KENDRA_HOUSES.includes(jupiter.house)) {
    yogas.push(`Kendra-adhipati strength: Jupiter in House ${jupiter.house} supports ethical growth and respected professional standing.`);
  }

  for (const p of planets) {
    if (p.exalted) yogas.push(`${p.planet} exalted (uchcha) in ${p.sign} at ${p.degree}° in house ${p.house}: graha bala is exceptionally strong — results manifest with less resistance in domains ruled by ${p.planet}.`);
    if (p.debilitated) yogas.push(`${p.planet} debilitated (neecha) in ${p.sign} at ${p.degree}° in house ${p.house}: Neecha Bhanga potential exists if cancellation conditions apply — mastery comes through deliberate remedial effort.`);
  }

  if (byName.Saturn && byName.Saturn.house === 10) {
    yogas.push('Saturn in 10th house: Slow but enduring career rise through discipline, governance, and institutional roles.');
  }

  if (byName.Sun && byName.Sun.house === 10) {
    yogas.push('Sun in 10th house: Natural authority, government or executive leadership, and strong public professional identity.');
  }

  return yogas.slice(0, 8);
}

async function generateVedicChart(input = {}) {
  await ensureEngine();

  const birth = parseBirthInput(input);
  const chart = await NodeJHora.calculate(
    birth.birthUtc,
    { latitude: birth.lat, longitude: birth.lon },
    'Lahiri'
  );

  const lagnaSignIndex = longitudeToSignIndex(chart.ascendant);
  const lagnaSign = SIGN_NAMES[lagnaSignIndex];
  const lagnaDegree = Math.round(getDegreeInSign(chart.ascendant) * 100) / 100;

  const grahaNames = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  const planets = grahaNames.map((name) => {
    const raw = chart.planets.find((p) => p.name === name);
    if (!raw) return null;
    return buildPlanetRecord(name, raw.longitude, raw.speed ?? 0, lagnaSignIndex);
  }).filter(Boolean);

  markCombust(planets);

  const houses = {};
  for (let h = 1; h <= 12; h += 1) {
    houses[`house_${h}`] = getHouseSignName(h, lagnaSignIndex);
  }

  const dashas = calculateVimshottariDasha(
    chart.planets.find((p) => p.name === 'Moon')?.longitude ?? 0,
    birth.birthUtc
  );
  const yogas = detectYogas(planets, lagnaSignIndex);

  const reading = generateFullReading({
    planets,
    lagnaSignIndex,
    lagnaSign,
    lagnaDegree,
    panchanga: chart.panchanga,
    dashas,
    yogas,
    gender: birth.gender,
  });

  const dashasWithEffects = dashas.map((d, i) => ({
    ...d,
    effect: reading.dashaAnalysis[i] || reading.dashaAnalysis.find((t) => t.startsWith(d.planet)) || '',
  }));

  let careerHouseAnalysis = reading.careerHouseAnalysis;
  let careerRecommendations = reading.careerRecommendations;
  let favorablePeriods = reading.favorablePeriods;
  let analysisParagraphs = reading.paragraphs;
  let careerPaths = reading.careerPaths;
  let yogasFinal = yogas;
  let aiEnhanced = false;

  if (isAiEnabled()) {
    try {
      const aiNarrative = await generateAstrologyNarrative({
        lagnaSign,
        lagnaDegree,
        nakshatra: chart.panchanga?.nakshatra,
        planets,
        houses,
        dashas: dashasWithEffects,
        yogas,
        gender: birth.gender,
        place: birth.place,
        ruleBasedSummary: reading.careerHouseAnalysis,
      });

      if (aiNarrative) {
        aiEnhanced = true;
        if (aiNarrative.careerHouseAnalysis) careerHouseAnalysis = aiNarrative.careerHouseAnalysis;
        if (aiNarrative.careerRecommendations) careerRecommendations = aiNarrative.careerRecommendations;
        if (aiNarrative.favorablePeriods?.length) favorablePeriods = aiNarrative.favorablePeriods;
        if (aiNarrative.analysisParagraphs?.length) analysisParagraphs = aiNarrative.analysisParagraphs;
        if (aiNarrative.careerPaths?.length) careerPaths = aiNarrative.careerPaths;
        if (aiNarrative.yogas?.length) yogasFinal = aiNarrative.yogas;
      }
    } catch (err) {
      console.warn('AI astrology narrative failed, using rule-based reading:', err.message);
    }
  }

  const chartCore = {
    lagnaSign,
    lagnaSignIndex,
    lagnaDegree,
    ascendant: chart.ascendant,
    ayanamsa: chart.ayanamsa || 'Lahiri',
    houseSystem: 'Whole Sign',
    nakshatra: chart.panchanga?.nakshatra?.name,
    nakshatraPada: chart.panchanga?.nakshatra?.pada,
    planets,
    houses,
  };

  const chartSvg = renderNorthIndianChart(chartCore, { dark: false });
  const chartImageDataUrl = svgToDataUrl(chartSvg);

  return {
    planets,
    houses,
    dashas: dashasWithEffects,
    yogas: yogasFinal,
    careerHouse: careerHouseAnalysis,
    careerHouseAnalysis,
    careerRecommendations,
    favorablePeriods,
    analysisParagraphs,
    careerPaths,
    planetInterpretations: reading.planetInterpretations,
    aiEnhanced,
    analysisSource: aiEnhanced ? 'vedic-chart+ai' : 'vedic-chart',
    birthChartData: {
      ...chartCore,
      chartSvg,
      chartImageDataUrl,
      panchanga: chart.panchanga,
      analysisParagraphs,
      careerPaths,
      planetInterpretations: reading.planetInterpretations,
      aiEnhanced,
      analysisSource: aiEnhanced ? 'vedic-chart+ai' : 'vedic-chart',
      coordinates: { lat: birth.lat, lon: birth.lon },
      birthInput: {
        day: birth.day,
        month: birth.month,
        year: birth.year,
        hour: birth.hour,
        minute: birth.minute,
        place: birth.place,
        gender: birth.gender,
      },
    },
    chartSvg,
    chartImageDataUrl,
    ascendant: lagnaSign,
    lagna: lagnaSign,
    nakshatra: chart.panchanga?.nakshatra?.name,
    pada: chart.panchanga?.nakshatra?.pada,
  };
}

module.exports = {
  generateVedicChart,
  parseBirthInput,
};
