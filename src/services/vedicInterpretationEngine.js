const {
  SIGN_NAMES,
  SIGN_LORDS,
  EXALTATION,
  DEBILITATION,
  KENDRA_HOUSES,
  TRIKONA_HOUSES,
  HOUSE_CAREER_THEMES,
  NAKSHATRA_LORDS,
} = require('./vedicAstrologyConstants');

const SIGN_ELEMENT = {
  Aries: 'fire', Taurus: 'earth', Gemini: 'air', Cancer: 'water',
  Leo: 'fire', Virgo: 'earth', Libra: 'air', Scorpio: 'water',
  Sagittarius: 'fire', Capricorn: 'earth', Aquarius: 'air', Pisces: 'water',
};

const SIGN_MODE = {
  Aries: 'cardinal', Taurus: 'fixed', Gemini: 'mutable', Cancer: 'cardinal',
  Leo: 'fixed', Virgo: 'mutable', Libra: 'cardinal', Scorpio: 'fixed',
  Sagittarius: 'mutable', Capricorn: 'cardinal', Aquarius: 'fixed', Pisces: 'mutable',
};

const PLANET_NATURE = {
  Sun: 'soul-purpose, authority, and father-figure archetypes',
  Moon: 'mind, public reception, and emotional decision-making',
  Mars: 'courage, competition, technical execution, and physical drive',
  Mercury: 'intellect, commerce, speech, and analytical processing',
  Jupiter: 'wisdom, expansion, ethics, and mentorship capacity',
  Venus: 'harmony, luxury, relationships, and creative refinement',
  Saturn: 'discipline, delay, structure, and karmic accountability',
  Rahu: 'obsession, foreign influence, disruption, and worldly ambition',
  Ketu: 'detachment, past-life skill, research, and spiritual redirection',
};

const NAKSHATRA_TRAITS = {
  Ashwini: 'swift initiation, healing instincts, and pioneering restlessness',
  Bharani: 'transformative creativity, moral testing, and capacity to bear responsibility',
  Krittika: 'sharp discernment, purification drive, and cutting through obstacles',
  Rohini: 'material magnetism, artistic sensuality, and growth orientation',
  Mrigashira: 'curiosity, searching intelligence, and adaptable communication',
  Ardra: 'intense mental storms, breakthrough thinking, and emotional catharsis',
  Punarvasu: 'renewal after setback, teaching ability, and optimistic recovery',
  Pushya: 'nourishing leadership, structured care, and dharmic nourishment',
  Ashlesha: 'penetrating psychology, strategic depth, and hypnotic influence',
  Magha: 'ancestral authority, throne-consciousness, and legacy-building',
  'Purva Phalguni': 'creative romance, relaxation talent, and celebratory leadership',
  'Uttara Phalguni': 'contractual reliability, patronage, and sustained partnership',
  Hasta: 'manual mastery, craftsmanship, and skillful manifestation',
  Chitra: 'architectural vision, design brilliance, and aesthetic engineering',
  Swati: 'independent trade winds, diplomatic flexibility, and self-made rise',
  Vishakha: 'goal fixation, competitive devotion, and achievement through focus',
  Anuradha: 'loyal networking, devotional friendship, and organized collaboration',
  Jyeshtha: 'senior authority, protective intensity, and crisis leadership',
  Mula: 'root-level investigation, uprooting falsehood, and foundational research',
  'Purva Ashadha': 'invincible conviction, persuasive water-energy, and public campaigns',
  'Uttara Ashadha': 'unyielding integrity, final victory after endurance, and institutional permanence',
  Shravana: 'listening intelligence, oral tradition mastery, and information synthesis',
  Dhanishta: 'rhythmic wealth-building, ensemble leadership, and resource orchestration',
  Shatabhisha: 'healing science, solitary insight, and unconventional problem-solving',
  'Purva Bhadrapada': 'intense idealism, transformative fire, and spiritual ferocity',
  'Uttara Bhadrapada': 'deep compassion, charitable authority, and wise containment',
  Revati: 'completion mastery, journey guidance, and compassionate protection of others',
};

const HOUSE_NAMES = {
  1: 'Lagna (Self & Vitality)',
  2: 'Dhana (Wealth & Speech)',
  3: 'Sahaja (Courage & Skills)',
  4: 'Sukha (Home & Emotional Foundation)',
  5: 'Putra (Intelligence & Creativity)',
  6: 'Ripu (Service & Competition)',
  7: 'Kalatra (Partnership & Public Dealings)',
  8: 'Randhra (Transformation & Hidden Gains)',
  9: 'Dharma (Fortune & Higher Purpose)',
  10: 'Karma (Career & Public Status)',
  11: 'Labha (Gains & Networks)',
  12: 'Vyaya (Expenses & Foreign Lands)',
};

function getHouseSignName(houseNum, lagnaSignIndex) {
  return SIGN_NAMES[(lagnaSignIndex + houseNum - 1) % 12];
}

function getLordships(lagnaSignIndex) {
  const map = {};
  for (let h = 1; h <= 12; h += 1) {
    const sign = getHouseSignName(h, lagnaSignIndex);
    const lord = SIGN_LORDS[sign];
    if (!map[lord]) map[lord] = [];
    map[lord].push(h);
  }
  return map;
}

function dignityPhrase(planet) {
  const parts = [];
  if (planet.exalted) parts.push(`exalted (uchcha) in ${planet.sign} at ${planet.degree}°, granting exceptional expressive power`);
  else if (planet.debilitated) parts.push(`debilitated (neecha) in ${planet.sign} at ${planet.degree}°, indicating lessons mastered through repetition and humility`);
  else if (SIGN_LORDS[planet.sign] === planet.planet) parts.push(`in own sign (${planet.sign}), operating with natural self-assurance`);
  else parts.push(`in ${planet.sign} at ${planet.degree}°`);

  if (planet.retrograde) parts.push('moving vakri (retrograde), internalizing its karmic lessons before external results manifest');
  if (planet.combust) parts.push('combust (asta) near the Sun, requiring conscious effort to assert its independent voice in career matters');
  return parts.join('; ');
}

function houseRelation(fromHouse, toHouse) {
  const diff = (toHouse - fromHouse + 12) % 12;
  const map = {
    0: 'conjunct the same life domain',
    1: 'feeding resources into',
    2: 'supporting through courage and initiative toward',
    3: 'creating stability and emotional roots for',
    4: 'bringing creativity and intelligence to',
    5: 'introducing service, competition, or health themes into',
    6: 'negotiating partnerships and public contracts related to',
    7: 'bringing transformation, research, or sudden change to',
    8: 'expanding fortune, mentorship, and higher purpose in',
    9: 'directly governing',
    10: 'channeling gains, networks, and ambition toward',
    11: 'connecting foreign, spiritual, or behind-the-scenes themes with',
  };
  return map[diff] || `influencing house ${toHouse}`;
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function computeVedicAspects(planets) {
  const aspects = [];
  for (const p of planets) {
    const seventh = ((p.house + 6 - 1) % 12) + 1;
    aspects.push({ from: p.planet, toHouse: seventh, type: '7th drishti' });
    if (p.planet === 'Mars') {
      aspects.push({ from: 'Mars', toHouse: ((p.house + 3 - 1) % 12) + 1, type: '4th drishti' });
      aspects.push({ from: 'Mars', toHouse: ((p.house + 7 - 1) % 12) + 1, type: '8th drishti' });
    }
    if (p.planet === 'Jupiter') {
      aspects.push({ from: 'Jupiter', toHouse: ((p.house + 4 - 1) % 12) + 1, type: '5th drishti' });
      aspects.push({ from: 'Jupiter', toHouse: ((p.house + 8 - 1) % 12) + 1, type: '9th drishti' });
    }
    if (p.planet === 'Saturn') {
      aspects.push({ from: 'Saturn', toHouse: ((p.house + 2 - 1) % 12) + 1, type: '3rd drishti' });
      aspects.push({ from: 'Saturn', toHouse: ((p.house + 9 - 1) % 12) + 1, type: '10th drishti' });
    }
  }
  return aspects;
}

function findConjunctions(planets) {
  const bySign = {};
  for (const p of planets) {
    const key = `${p.sign}-${p.house}`;
    if (!bySign[key]) bySign[key] = [];
    bySign[key].push(p.planet);
  }
  return Object.entries(bySign)
    .filter(([, group]) => group.length > 1)
    .map(([key, group]) => {
      const [sign, house] = key.split('-');
      return { planets: group, sign, house: Number(house) };
    });
}

function interpretPlanetPlacement(planet, lordships, lagnaSignIndex) {
  const rules = lordships[planet.planet] || [];
  const rulesLabel = rules.length
    ? `As lord of house${rules.length > 1 ? 's' : ''} ${rules.join(', ')} (${rules.map((h) => HOUSE_NAMES[h]).join('; ')}), `
    : '';

  const element = SIGN_ELEMENT[planet.sign];
  const mode = SIGN_MODE[planet.sign];
  const houseTheme = HOUSE_CAREER_THEMES[planet.house];

  let text = `${rulesLabel}${planet.planet} is placed in ${planet.sign} (${element}/${mode} sign) in the ${ordinal(planet.house)} house — ${HOUSE_NAMES[planet.house]}. `;
  text += `It is ${dignityPhrase(planet)}. `;
  text += `This placement channels ${PLANET_NATURE[planet.planet]} through ${houseTheme}. `;

  if (rules.includes(10)) {
    text += `Because ${planet.planet} rules your 10th house of career, its condition in house ${planet.house} becomes a primary indicator of how your professional reputation develops — `;
    if (planet.house === 10) text += 'being placed directly in the 10th, career identity and public role are central to your life purpose.';
    else if (KENDRA_HOUSES.includes(planet.house)) text += `placed in a Kendra (house ${planet.house}), career success becomes visible through angular, high-impact life domains.`;
    else if (TRIKONA_HOUSES.includes(planet.house)) text += `placed in a Trikona (house ${planet.house}), dharmic alignment supports long-term professional fulfillment.`;
    else if ([6, 8, 12].includes(planet.house)) text += `placed in a dusthana (house ${planet.house}), career growth requires overcoming obstacles, but mastery here produces uncommon resilience.`;
    else text += `career results flow through the themes of house ${planet.house}: ${houseTheme}.`;
  }

  if (rules.includes(1)) {
    text += ` As Lagna lord, ${planet.planet} strongly colors your personality and the lens through which employers and society perceive your professional competence.`;
  }

  return text;
}

function interpretLagna(lagnaSign, lagnaDegree, lagnaSignIndex, planets, lordships) {
  const lagnaLord = SIGN_LORDS[lagnaSign];
  const lordPlanet = planets.find((p) => p.planet === lagnaLord);
  const element = SIGN_ELEMENT[lagnaSign];
  const mode = SIGN_MODE[lagnaSign];

  let text = `Your Lagna (Ascendant) rises in ${lagnaSign} at ${lagnaDegree}° — a ${mode} ${element} ascendant. `;
  text += `This frames your professional approach: ${element === 'fire' ? 'bold initiative and visible action' : element === 'earth' ? 'practical results and material consolidation' : element === 'air' ? 'intellectual networking and communicative versatility' : 'intuitive adaptation and people-centered work'}. `;

  if (lordPlanet) {
    text += `Lagna lord ${lagnaLord} sits in house ${lordPlanet.house} in ${lordPlanet.sign} (${dignityPhrase(lordPlanet)}), `;
    text += `${houseRelation(1, lordPlanet.house)} your core identity. `;
    if (lordPlanet.house === 10) text += 'This is a powerful Dharma-Karma link — self and career are fused; your personal brand IS your profession.';
    if (lordPlanet.house === 6) text += 'Success comes through competitive service environments, problem-solving, and outperforming rivals.';
    if (lordPlanet.house === 9) text += 'Fortune favors advisory, educational, legal, or spiritually aligned career paths blessed by mentors.';
  }

  return text;
}

function interpretMoonNakshatra(moon, nakshatra, pada, dashas) {
  if (!moon) return '';
  const trait = NAKSHATRA_TRAITS[nakshatra] || 'distinctive lunar temperament shaping vocational instincts';
  const nakLord = NAKSHATRA_LORDS[Math.floor(moon.longitude / (360 / 27))] || '—';
  const currentDasha = dashas.find((d) => d.isCurrent);

  let text = `Moon at ${moon.degree}° ${moon.sign} in house ${moon.house}, in ${nakshatra} Nakshatra (Pada ${pada}), ruled by ${nakLord}. `;
  text += `This lunar pattern reveals ${trait}. `;
  text += `Your mind processes career decisions through house ${moon.house} themes: ${HOUSE_CAREER_THEMES[moon.house]}. `;

  if (currentDasha && currentDasha.planet === nakLord) {
    text += `The current ${nakLord} Mahadasha aligns with your birth nakshatra lord — a intensified period where lunar instincts and dasha karma synchronize, accelerating vocational turning points.`;
  } else if (currentDasha) {
    text += `While ${nakLord} rules your nakshatra, the active ${currentDasha.planet} Mahadasha (${currentDasha.period}) currently steers timing — watch for results when dasha lord and nakshatra lord exchange houses or aspect each other.`;
  }

  return text;
}

function interpretTenthHouse(planets, lagnaSignIndex, lordships) {
  const tenthSign = getHouseSignName(10, lagnaSignIndex);
  const tenthLord = SIGN_LORDS[tenthSign];
  const lordPlanet = planets.find((p) => p.planet === tenthLord);
  const occupants = planets.filter((p) => p.house === 10);
  const aspectors = computeVedicAspects(planets).filter((a) => a.toHouse === 10);

  let text = `=== 10th House (Karma Bhava) Deep Analysis ===\n`;
  text += `The 10th cusp falls in ${tenthSign}, ruled by ${tenthLord}. `;
  text += `For ${tenthSign} on the Midheaven, public career expression carries ${SIGN_MODE[tenthSign]} ${SIGN_ELEMENT[tenthSign]} qualities — `;
  text += `${tenthSign === 'Aries' ? 'pioneering command and independent professional identity' : tenthSign === 'Taurus' ? 'steady wealth-building and tangible value creation' : tenthSign === 'Gemini' ? 'multi-domain communication and intellectual commerce' : tenthSign === 'Cancer' ? 'nurturing leadership and public emotional intelligence' : tenthSign === 'Leo' ? 'authoritative visibility and creative executive presence' : tenthSign === 'Virgo' ? 'precision, service excellence, and analytical mastery' : tenthSign === 'Libra' ? 'diplomatic negotiation, design, and balanced partnerships' : tenthSign === 'Scorpio' ? 'investigative depth, strategic control, and transformative industries' : tenthSign === 'Sagittarius' ? 'teaching, law, publishing, and expansive advisory roles' : tenthSign === 'Capricorn' ? 'institutional authority, governance, and long-horizon ambition' : tenthSign === 'Aquarius' ? 'innovation, systems thinking, and humanitarian enterprise' : 'compassionate service, creative imagination, and healing vocations'}. `;

  if (occupants.length) {
    for (const p of occupants) {
      text += `${p.planet} occupies your 10th house in ${p.sign} at ${p.degree}° (${dignityPhrase(p)}). `;
      text += `This directly imprints ${PLANET_NATURE[p.planet]} onto your public reputation. `;
      if (p.exalted) text += `Exaltation here is a strong indicator of recognized authority in the field governed by ${p.planet}. `;
      if (p.debilitated) text += `Debilitation demands extra effort, but many distinguished careers are built by mastering a debilitated 10th-house planet through discipline. `;
      if (p.retrograde) text += `Retrograde motion suggests career reinvention — you may change professional direction before finding your true public calling. `;
    }
  } else {
    text += 'No planet directly tenants the 10th house; career outcomes depend heavily on the 10th lord\'s placement and aspects received. ';
  }

  if (lordPlanet) {
    text += `The 10th lord ${tenthLord} is positioned in house ${lordPlanet.house} (${HOUSE_NAMES[lordPlanet.house]}) in ${lordPlanet.sign} at ${lordPlanet.degree}°. `;
    text += `This ${houseRelation(10, lordPlanet.house)} your career house — `;
    text += `professional success activates through ${HOUSE_CAREER_THEMES[lordPlanet.house]}. `;
    if (lordPlanet.exalted) text += `An exalted 10th lord is among the strongest career indicators in Jyotish. `;
    if (lordPlanet.debilitated) text += `A debilitated 10th lord does not deny success — it demands strategic patience, remedial discipline, and mastery of the house it occupies. `;
  }

  if (aspectors.length) {
    const unique = [...new Set(aspectors.map((a) => `${a.from} (${a.type})`))];
    text += `The 10th house receives drishti from: ${unique.join(', ')}. `;
    for (const a of aspectors) {
      text += `${a.from}'s ${a.type} on the 10th ${a.from === 'Saturn' ? 'brings sustained effort and eventual authority' : a.from === 'Jupiter' ? 'expands recognition and ethical standing' : a.from === 'Mars' ? 'adds competitive drive and executive aggression' : 'modifies career expression'}. `;
    }
  }

  return text;
}

function scorePlanetStrength(planet, lordships) {
  let score = 50;
  if (planet.exalted) score += 25;
  if (planet.debilitated) score -= 20;
  if (SIGN_LORDS[planet.sign] === planet.planet) score += 15;
  if (KENDRA_HOUSES.includes(planet.house)) score += 10;
  if (TRIKONA_HOUSES.includes(planet.house)) score += 8;
  if (planet.house === 10) score += 20;
  if ((lordships[planet.planet] || []).includes(10)) score += 15;
  if (planet.retrograde) score -= 5;
  if (planet.combust) score -= 8;
  return score;
}

function generateCareerPaths(planets, lagnaSignIndex, lordships, dashas) {
  const paths = [];
  const currentDasha = dashas.find((d) => d.isCurrent);
  const tenthSign = getHouseSignName(10, lagnaSignIndex);
  const tenthLord = SIGN_LORDS[tenthSign];
  const tenthLordPlanet = planets.find((p) => p.planet === tenthLord);

  for (const p of planets) {
    const score = scorePlanetStrength(p, lordships);
    if (score < 55 && p.house !== 10 && !(lordships[p.planet] || []).includes(10)) continue;

    const rules = lordships[p.planet] || [];
    let title = '';
    let reasoning = '';

    if (p.house === 10) {
      title = `${p.planet}-dominated public career`;
      reasoning = `${p.planet} sits directly in your 10th house in ${p.sign} at ${p.degree}°, making ${PLANET_NATURE[p.planet]} the face of your professional identity.`;
    } else if (rules.includes(10)) {
      title = `Career through ${p.planet} lordship`;
      reasoning = `As 10th lord placed in house ${p.house} (${HOUSE_NAMES[p.house]}), ${p.planet} channels career results through ${HOUSE_CAREER_THEMES[p.house]}.`;
    } else if (KENDRA_HOUSES.includes(p.house) && (p.exalted || SIGN_LORDS[p.sign] === p.planet)) {
      title = `Authority via ${p.planet} in Kendra`;
      reasoning = `Strong ${p.planet} in Kendra house ${p.house} supports visible leadership aligned with ${PLANET_NATURE[p.planet]}.`;
    } else {
      title = `Supporting path: ${p.planet} in house ${p.house}`;
      reasoning = `${p.planet} in ${p.sign} (house ${p.house}) contributes ${PLANET_NATURE[p.planet]} as a secondary professional channel.`;
    }

    paths.push({ title, reasoning, match: `${Math.min(98, score)}%`, planet: p.planet, score });
  }

  if (tenthLordPlanet && !paths.find((p) => p.planet === tenthLord)) {
    paths.push({
      title: `Primary karma path via ${tenthLord}`,
      reasoning: `10th lord ${tenthLord} in house ${tenthLordPlanet.house} in ${tenthLordPlanet.sign} defines the master key to your career — ${dignityPhrase(tenthLordPlanet)}.`,
      match: `${Math.min(98, scorePlanetStrength(tenthLordPlanet, lordships) + 10)}%`,
      planet: tenthLord,
      score: scorePlanetStrength(tenthLordPlanet, lordships) + 10,
    });
  }

  if (currentDasha) {
    const dashaPlanet = planets.find((p) => p.planet === currentDasha.planet);
    if (dashaPlanet) {
      paths.push({
        title: `Active ${currentDasha.planet} Mahadasha channel`,
        reasoning: `Current dasha (${currentDasha.period}) activates ${currentDasha.planet} in house ${dashaPlanet.house} — ${currentDasha.effect}`,
        match: 'Timing-active',
        planet: currentDasha.planet,
        score: scorePlanetStrength(dashaPlanet, lordships) + 12,
      });
    }
  }

  return paths
    .sort((a, b) => b.score - a.score)
    .filter((p, i, arr) => arr.findIndex((x) => x.title === p.title) === i)
    .slice(0, 6);
}

function interpretDashaForCareer(dasha, planets, lordships) {
  const p = planets.find((pl) => pl.planet === dasha.planet);
  if (!p) return dasha.effect;

  const rules = lordships[dasha.planet] || [];
  let text = `${dasha.planet} Mahadasha (${dasha.period}): `;
  text += `${p.planet} operates from house ${p.house} in ${p.sign} (${dignityPhrase(p)}). `;

  if (rules.includes(10)) text += `As dasha lord AND 10th-house ruler, this period is career-defining — promotions, role changes, and public recognition are strongly indicated. `;
  else if (p.house === 10) text += `Dasha lord tenants the 10th house — direct career activation, visibility, and professional milestones. `;
  else if (KENDRA_HOUSES.includes(p.house)) text += `Dasha lord in Kendra house ${p.house} supports angular life changes with professional spillover. `;
  else text += `Career effects route through house ${p.house}: ${HOUSE_CAREER_THEMES[p.house]}. `;

  if (dasha.isCurrent) text += '★ This is your CURRENT operating period — decisions made now shape the next decade of professional karma.';

  return text;
}

function interpretConjunctions(conjunctions) {
  return conjunctions.map((c) => {
    const list = c.planets.join(' and ');
    return `${list} conjoined in ${c.sign} (house ${c.house}): their energies fuse — ${c.planets.map((p) => PLANET_NATURE[p]).join('; ')} — producing a combined vocational signature unique to this chart configuration.`;
  });
}

function generateFullReading(ctx) {
  const {
    planets, lagnaSignIndex, lagnaSign, lagnaDegree, panchanga, dashas, yogas, gender,
  } = ctx;

  const lordships = getLordships(lagnaSignIndex);
  const moon = planets.find((p) => p.planet === 'Moon');
  const nakshatra = panchanga?.nakshatra?.name || '—';
  const pada = panchanga?.nakshatra?.pada || '—';
  const conjunctions = findConjunctions(planets);
  const aspects = computeVedicAspects(planets);

  const paragraphs = [];

  paragraphs.push(interpretLagna(lagnaSign, lagnaDegree, lagnaSignIndex, planets, lordships));
  paragraphs.push(interpretMoonNakshatra(moon, nakshatra, pada, dashas));

  for (const p of planets) {
    paragraphs.push(interpretPlanetPlacement(p, lordships, lagnaSignIndex));
  }

  if (conjunctions.length) {
    paragraphs.push(...interpretConjunctions(conjunctions));
  }

  const careerHouseAnalysis = interpretTenthHouse(planets, lagnaSignIndex, lordships);

  const dashaAnalysis = dashas.map((d) => interpretDashaForCareer(d, planets, lordships));
  const currentDasha = dashas.find((d) => d.isCurrent) || dashas[0];
  if (currentDasha) {
    paragraphs.push(dashaAnalysis.find((d) => d.startsWith(currentDasha.planet)) || dashaAnalysis[0]);
  }

  if (yogas.length) {
    paragraphs.push(`Yogas (planetary combinations) identified in your unique chart: ${yogas.join(' ')}`);
  }

  const careerPaths = generateCareerPaths(planets, lagnaSignIndex, lordships, dashas);
  const careerRecommendations = careerPaths
    .slice(0, 4)
    .map((p, i) => `${i + 1}. ${p.title}: ${p.reasoning}`)
    .join(' ');

  const favorablePeriods = dashas
    .filter((d) => {
      const p = planets.find((pl) => pl.planet === d.planet);
      if (!p) return false;
      return p.house === 10 || (lordships[d.planet] || []).includes(10) || KENDRA_HOUSES.includes(p.house);
    })
    .slice(0, 5)
    .map((d) => interpretDashaForCareer(d, planets, lordships));

  if (gender) {
    paragraphs.push(
      `Gender context (${gender}): Lagna in ${lagnaSign} with Moon in house ${moon?.house || '—'} suggests balancing ${gender === 'Female' ? 'nurturing leadership with assertive career boundaries' : gender === 'Male' ? 'authoritative drive with collaborative emotional intelligence' : 'authentic self-expression with professional adaptability'} — always read in conjunction with the full chart, not in isolation.`
    );
  }

  return {
    paragraphs,
    careerHouseAnalysis,
    careerRecommendations,
    favorablePeriods,
    careerPaths,
    dashaAnalysis,
    lordships,
    conjunctions,
    aspects,
    planetInterpretations: planets.map((p) => ({
      planet: p.planet,
      sign: p.sign,
      house: p.house,
      degree: p.degree,
      text: interpretPlanetPlacement(p, lordships, lagnaSignIndex),
    })),
  };
}

module.exports = {
  generateFullReading,
  interpretPlanetPlacement,
  interpretTenthHouse,
  generateCareerPaths,
  getLordships,
};
