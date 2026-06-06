const FREE_INCLUSIONS = [
  '10-Page Report',
  'Basic Astrology Overview',
  'Palmistry Base Analysis',
  'Face Reading Summary',
  'All Uploaded Images Included',
  'Standard PDF Generation',
];

const PREMIUM_INCLUSIONS = [
  '15-Page Detailed Report',
  'Full Astrological Houses',
  'Detailed Palmistry Line Analysis',
  'Face Reading Trait Matching',
  'All Uploaded Images Included',
  '3-Year Career Roadmap',
  'High-Resolution PDF',
];

const TIER_META = {
  free: {
    label: 'Cosmic Explorer',
    badge: 'Free Plan',
    tagline: 'Basic insights into your cosmic blueprint.',
    accent: '#1e3a5f',
    accentSoft: '#eef2ff',
  },
  premium: {
    label: 'Astral Navigator',
    badge: 'Premium Plan',
    tagline: 'Detailed Vedic astrology and career assessment.',
    accent: '#1e3a5f',
    accentSoft: '#eef2ff',
    accentGold: '#1e3a5f',
    professional: true,
    footer: 'LifeOn66 — Astral Navigator Premium Report',
    pageCount: 15,
  },
  professional: {
    label: 'Professional Consultation',
    badge: 'Professional Report',
    tagline: 'Comprehensive personalized cosmic assessment.',
    accent: '#1e293b',
    accentSoft: '#f8fafc',
    accentGold: '#1e293b',
    professional: true,
  },
};

function pickTierText(tier, free, premium, professional) {
  if (tier === 'professional') return professional;
  if (tier === 'premium') return premium;
  return free;
}

function asList(items) {
  if (!items?.length) return '';
  return `<ul class="bullet-list">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
}

function asParagraphs(texts) {
  return texts.filter(Boolean).map((t) => `<p>${t}</p>`).join('');
}

function imageFigure(src, label, analysis, tier, variant = 'default') {
  if (!src) {
    return `<div class="img-missing"><span class="cap-label">${label}</span><p>No image uploaded for this view.</p></div>`;
  }
  const safeSrc = src.replace(/"/g, '&quot;');
  const frameClass = variant === 'face' ? 'img-frame face-frame' : variant === 'palm' ? 'img-frame palm-frame' : variant === 'gallery' ? 'img-frame gallery-frame' : 'img-frame';
  const detail = pickTierText(
    tier,
    analysis?.slice?.(0, 280) || 'Visual markers indicate distinctive energetic patterns relevant to your life path.',
    analysis?.slice?.(0, 520) || 'Detailed analysis reveals nuanced behavioral tendencies and long-term career inclinations from your uploaded image.',
    analysis || 'Advanced analysis of line depth, mount prominence, and structural balance suggests leadership capacity and strategic foresight.'
  );
  return `
    <figure class="img-figure ${variant !== 'default' ? `img-figure-${variant}` : ''}">
      <div class="${frameClass}">
        <img src="${safeSrc}" alt="${label}" loading="eager" decoding="sync" />
      </div>
      <figcaption><span class="cap-label">${label}</span></figcaption>
      ${variant !== 'gallery' ? `<div class="img-analysis">${detail}</div>` : ''}
    </figure>`;
}

function normalizeDashas(astro, analysis) {
  const raw = astro.dashas || astro.planetaryPeriods || analysis.dashas || analysis.planetaryPeriods || [];
  if (!Array.isArray(raw)) return [];
  return raw.map((d) => ({
    planet: d.planet || d.name || d.lord || d.mahaDasha || '',
    period: d.period || d.duration || d.timeframe || d.years || '',
    effect: d.effect || d.description || d.result || d.influence || '',
  })).filter((d) => d.planet || d.period || d.effect);
}

function normalizePlanets(astro, analysis) {
  const raw = astro.planets || astro.birthChartData?.planets || analysis.planets || [];
  if (!Array.isArray(raw)) return [];
  return raw.map((p) => ({
    planet: p.planet || p.name || p.graha || '',
    sign: p.sign || p.rashi || '',
    house: p.house || p.bhava || '',
    degree: p.degree != null ? p.degree : '',
  })).filter((p) => p.planet);
}

function buildContent(analysis = {}, fullData = {}, tier, userName, userDetails = {}) {
  const palm = fullData.palmistry || {};
  const face = fullData.face || {};
  const astro = fullData.astrology || analysis.astrology || {};
  const traits = typeof face.personalityTraits === 'object' ? face.personalityTraits : {};

  const strengths = analysis.strengthsSummary || analysis.strengths || traits.strengths || [
    'Strategic foresight', 'Leadership presence', 'Analytical depth', 'Resilience', 'Communication clarity',
  ];

  const dashas = normalizeDashas(astro, analysis);
  const planets = normalizePlanets(astro, analysis);
  const yogas = astro.yogas || analysis.yogas || [];
  const favorablePeriods = astro.favorablePeriods || analysis.favorablePeriods || analysis.bestTiming || [];

  return {
    intro: `${userName}, this report integrates your Vedic astrology chart, palm line analysis, and facial physiognomy into one career-focused assessment.`,
    astrologyParagraphs: buildAstrologyParagraphs(astro, dashas, planets, yogas, favorablePeriods, analysis),
    palmLeftParagraphs: buildPalmParagraphs('left', palm, analysis),
    palmRightParagraphs: buildPalmParagraphs('right', palm, analysis),
    faceFrontParagraphs: buildFaceParagraphs('front', face, traits, analysis),
    faceLeftParagraphs: buildFaceParagraphs('left', face, traits, analysis),
    faceRightParagraphs: buildFaceParagraphs('right', face, traits, analysis),
    personality: analysis.personalitySummary || traits.overview || traits.summary,
    career: astro.careerRecommendations || palm.careerRecommendations || face.careerRecommendations || analysis.synthesizedRecommendation,
    love: analysis.loveAnalysis || analysis.relationshipInsights || traits.relationships,
    health: analysis.healthInsights || analysis.healthSummary || traits.health,
    strengths,
    challenges: analysis.developmentAreas || analysis.challenges || traits.challenges || ['Delegation', 'Patience', 'Work-life balance'],
    careers: analysis.topCareerPaths || analysis.careerPaths || [],
    future: favorablePeriods,
    remedies: analysis.remedies || analysis.actionItems,
    conclusion: analysis.synthesizedRecommendation || analysis.finalSummary,
    confidence: analysis.confidenceScore || palm.confidenceScore || face.confidenceScore || 91,
    sixMonth: analysis.sixMonthPathway || [],
    threeYear: analysis.threeYearPathway || [],
    dashas,
    planets,
    yogas,
    userDetails,
  };
}

function buildAstrologyParagraphs(astro, dashas, planets, yogas, periods, analysis) {
  const parts = [];
  if (astro.careerHouseAnalysis) parts.push(astro.careerHouseAnalysis);
  if (astro.birthChartData?.nakshatra) {
    const pada = astro.birthChartData.pada ? ` (Pada ${astro.birthChartData.pada})` : '';
    parts.push(`${astro.birthChartData.nakshatra}${pada} shapes your core temperament, decision style, and long-term ambition.`);
  }
  if (dashas.length) {
    const d = dashas[0];
    parts.push(`Current ${d.planet || 'planetary'} period${d.period ? ` (${d.period})` : ''}: ${d.effect || 'disciplined growth with powerful long-term results.'}`);
  }
  if (planets.length) {
    parts.push(`Key chart placements: ${planets.slice(0, 6).map((p) => `${p.planet || p.name || 'Planet'} in ${p.sign || '—'}${p.house ? ` (House ${p.house})` : ''}`).join(', ')}.`);
  }
  if (yogas.length) parts.push(typeof yogas[0] === 'string' ? yogas.join('. ') : yogas.map((y) => y.name || y).join('. '));
  if (periods.length) parts.push(`Favorable windows: ${periods.map((p) => (typeof p === 'string' ? p : `${p.period || p.year}: ${p.focus || p.milestone || ''}`)).join('; ')}.`);
  if (astro.careerRecommendations) parts.push(`Career direction favors ${astro.careerRecommendations.toLowerCase()}.`);
  if (analysis.astrologySummary) parts.push(analysis.astrologySummary);
  if (!parts.length) parts.push('Your birth chart emphasizes career houses, sustained professional growth, and leadership potential through disciplined effort.');
  return parts;
}

function buildPalmParagraphs(hand, palm, analysis) {
  const parts = [];
  if (hand === 'left') {
    if (palm.headLineAnalysis) parts.push(`Head line: ${palm.headLineAnalysis}`);
    if (palm.sunLineAnalysis) parts.push(`Sun line: ${palm.sunLineAnalysis}`);
    if (palm.careerRecommendations) parts.push(palm.careerRecommendations);
  } else {
    if (palm.fateLineAnalysis) parts.push(`Fate line: ${palm.fateLineAnalysis}`);
    if (palm.headLineAnalysis) parts.push(`Head line: ${palm.headLineAnalysis}`);
    if (palm.careerRecommendations) parts.push(palm.careerRecommendations);
  }
  if (analysis.palmistrySummary) parts.push(analysis.palmistrySummary);
  if (!parts.length) {
    parts.push(hand === 'left'
      ? 'Long head line indicates strong analytical and creative intelligence. Weaker early fate line suggests self-made success through persistence.'
      : 'Strengthening fate line indicates improving career clarity and stability with long-term recognition.');
  }
  return parts;
}

function buildFaceParagraphs(view, face, traits, analysis) {
  const parts = [];
  if (view === 'front') {
    if (traits.overview) parts.push(traits.overview);
    if (face.careerRecommendations) parts.push(face.careerRecommendations);
    if (analysis.faceSummary) parts.push(analysis.faceSummary);
    if (!parts.length) parts.push('Balanced facial symmetry reflects logical thinking combined with emotional control and leadership presence.');
  } else if (view === 'right') {
    parts.push(traits.rightProfile || traits.decisionMaking || 'Stable decision-making and a practical, results-oriented mindset.');
  } else {
    parts.push(traits.leftProfile || traits.patience || 'Consistent growth pattern driven by patience, discipline, and steady effort.');
  }
  if (traits.summary && view === 'front') parts.push(traits.summary);
  return parts;
}

function textOnlyAnalysisPage(title, paragraphs) {
  const text = (Array.isArray(paragraphs) ? paragraphs : [paragraphs])
    .filter(Boolean)
    .map((p) => `<p>${p}</p>`)
    .join('');
  return `
    ${sectionHeader(title)}
    <div class="content-card compact-card">
      <div class="analysis-text">${text}</div>
    </div>`;
}

function embeddedAnalysisPage(title, src, paragraphs, variant = 'palm') {
  const safeSrc = src ? src.replace(/"/g, '&quot;') : '';
  const imageBlock = src
    ? `<div class="embedded-hero ${variant}"><img src="${safeSrc}" alt="${title}" loading="eager" decoding="sync" /></div>`
    : `<div class="img-missing embedded-missing"><span class="cap-label">${title}</span><p>No image uploaded for this view.</p></div>`;
  const text = (Array.isArray(paragraphs) ? paragraphs : [paragraphs])
    .filter(Boolean)
    .map((p) => `<p>${p}</p>`)
    .join('');
  return `
    ${sectionHeader(title)}
    <div class="content-card embedded-analysis-page">
      ${imageBlock}
      <div class="analysis-text">${text}</div>
    </div>`;
}

function analysisPage(title, src, paragraphs, variant = 'palm') {
  const safeSrc = src ? src.replace(/"/g, '&quot;') : '';
  const imageBlock = src
    ? `<div class="hero-image ${variant}"><img src="${safeSrc}" alt="${title}" loading="eager" decoding="sync" /></div>`
    : `<div class="img-missing hero-missing"><span class="cap-label">${title}</span><p>No image uploaded for this view.</p></div>`;
  const text = (Array.isArray(paragraphs) ? paragraphs : [paragraphs])
    .filter(Boolean)
    .map((p) => `<p>${p}</p>`)
    .join('');
  return `
    ${sectionHeader(title)}
    <div class="content-card analysis-page">
      ${imageBlock}
      <div class="analysis-text">${text}</div>
    </div>`;
}

function careerBlueprintInner(c) {
  const rows = c.careers.length
    ? c.careers.slice(0, 4).map((r) => `<tr><td>${r.title || r.role || 'Career Path'}</td><td>${r.match || r.salary || '—'}</td><td>${r.reasoning || r.note || ''}</td></tr>`).join('')
    : `<tr><td>First Job</td><td>₹3.5–6.5 LPA</td><td>Entry into tech / structured sector</td></tr>
       <tr><td>2 Years</td><td>₹6–12 LPA</td><td>Growth into mid-level roles</td></tr>
       <tr><td>4 Years</td><td>₹12–25 LPA</td><td>Senior / lead positions</td></tr>
       <tr><td>30+</td><td>₹25L+ / Business</td><td>Leadership, startup, or executive path</td></tr>`;

  const phases = c.threeYear.length
    ? c.threeYear.map((y, i) => `<p><strong>Phase ${i + 1}:</strong> ${y.year || y.title || ''} — ${y.milestone || y.focus || ''}</p>`).join('')
    : `<p><strong>Phase 1 (2025–2027):</strong> Entry and skill building in your strongest sector.</p>
       <p><strong>Phase 2 (2027–2030):</strong> Growth into higher-responsibility roles.</p>
       <p><strong>Phase 3 (30+):</strong> Leadership, business ownership, or executive authority.</p>`;

  return `
      <p class="panel-title">Career Blueprint</p>
      ${phases}
      <table class="pro-data-table">
        <thead><tr><th>Stage</th><th>Range / Match</th><th>Focus</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="career-note">${c.career || 'Focus on mastery, consistency, and environments that reward skill and leadership.'}</p>`;
}

function careerBlueprintTable(c) {
  return `
    ${sectionHeader('Career Blueprint')}
    <div class="content-card compact-card">${careerBlueprintInner(c).replace('<p class="panel-title">Career Blueprint</p>', '')}</div>`;
}

function sectionHeader(title) {
  return `
    <div class="section-header">
      <span class="section-title">${title}</span>
    </div>`;
}

function featureGrid(items) {
  return `<div class="feature-grid">${items.map((item) => `<div class="feature-item"><span class="check">✓</span><span>${item}</span></div>`).join('')}</div>`;
}

function statCard(label, value) {
  return `<div class="stat-card"><span class="stat-label">${label}</span><span class="stat-value">${value}</span></div>`;
}

const { getReportLogoDataUrl } = require('../utils/reportLogo');

let reportLogoSrc = '';

function lifeOn66Logo(className = 'report-logo') {
  const src = reportLogoSrc || getReportLogoDataUrl();
  if (!src) {
    return `<div class="${className} brand-logo">Life<span>On66</span></div>`;
  }
  return `<div class="${className} brand-mark" role="img" aria-label="LifeOn66"></div>`;
}

function userDetailsTable(userName, userDetails) {
  return `
    <table class="details-table pro-table">
      <tr><td>Full Name</td><td>${userName}</td></tr>
      <tr><td>Date of Birth</td><td>${userDetails.dateOfBirth || '—'}</td></tr>
      <tr><td>Time of Birth</td><td>${userDetails.timeOfBirth || '—'}</td></tr>
      <tr><td>Place of Birth</td><td>${userDetails.placeOfBirth || '—'}</td></tr>
      <tr><td>Report Date</td><td>${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td></tr>
    </table>`;
}

function premiumCoverPage(userName, theme) {
  const reportDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return `
    <div class="cover">
      <div class="cover-band"></div>
      <div class="cover-inner cover-simple">
        ${lifeOn66Logo('report-logo-lg')}
        <p class="cover-label">${theme.badge || 'Premium Plan'}</p>
        <h1>Personal Astrology Report</h1>
        <p class="cover-subtitle">Integrated Analysis: Astrology · Palmistry · Face Reading · Career Strategy</p>
        <div class="cover-meta-simple">
          <p><strong>Prepared for:</strong> ${userName}</p>
          <p><strong>Date:</strong> ${reportDate}</p>
        </div>
        <div class="inclusions-panel">
          <p class="panel-title">Your Premium Report Includes · $5.00</p>
          ${featureGrid(PREMIUM_INCLUSIONS)}
        </div>
      </div>
    </div>`;
}

function buildPremiumOverviewPage(c, userName, userDetails, theme) {
  return `
    ${sectionHeader('Premium Report Overview')}
    <div class="content-card compact-card">
      <div class="stats-row">
        ${statCard('Confidence Score', `${c.confidence}%`)}
        ${statCard('Report Pages', String(theme.pageCount || 15))}
      </div>
      <table class="details-table pro-table">
        <tr><td>Full Name</td><td>${userName}</td></tr>
        <tr><td>Date of Birth</td><td>${userDetails.dateOfBirth || '—'}</td></tr>
        <tr><td>Time of Birth</td><td>${userDetails.timeOfBirth || '—'}</td></tr>
        <tr><td>Place of Birth</td><td>${userDetails.placeOfBirth || '—'}</td></tr>
      </table>
      <p class="panel-title" style="margin-top:12px">Included in Your $5 Premium Report</p>
      ${featureGrid(PREMIUM_INCLUSIONS)}
      <p class="lead-text" style="margin-top:14px"><strong>Executive Summary:</strong> ${c.intro}</p>
    </div>`;
}

function buildAstrologyDeepAnalysisPage(c, astro, theme) {
  let dashaItems = c.dashas.length ? c.dashas : [];
  if (!dashaItems.length && c.future?.length) {
    dashaItems = c.future.map((p) => ({
      planet: typeof p === 'string' ? 'Favorable Period' : p.planet || 'Favorable Period',
      period: typeof p === 'string' ? p.split(':')[0]?.trim() : p.period || p.year || '',
      effect: typeof p === 'string' ? p.split(':').slice(1).join(':').trim() : p.focus || p.milestone || '',
    }));
  }
  if (!dashaItems.length && c.planets.length) {
    dashaItems = [
      { planet: 'Current Phase', period: '2025–2027', effect: 'Skill building and professional foundation.' },
      { planet: 'Growth Phase', period: '2027–2030', effect: 'Leadership exposure and career acceleration.' },
      { planet: 'Peak Phase', period: '2030+', effect: 'Authority, business expansion, or executive recognition.' },
    ];
  }

  const dashaBlock = dashaItems.length
    ? dashaItems.map((d) => `<p class="compact-line"><strong>${d.planet || '—'}</strong> ${d.period ? `(${d.period})` : ''}: ${d.effect || '—'}</p>`).join('')
    : '<p class="compact-line">Complete your birth chart reading to populate personalized planetary periods.</p>';

  return `
    ${sectionHeader('Astrology Deep Analysis')}
    <div class="content-card compact-card">
      <div class="premium-meta-row">
        ${statCard('Confidence Score', `${c.confidence}%`)}
        <div class="stat-card"><span class="stat-label">Plan Tier</span><span class="stat-value stat-value-sm">${theme.label || 'Astral Navigator'}</span></div>
      </div>
      ${c.astrologyParagraphs.map((p) => `<p>${p}</p>`).join('')}
      <p class="panel-title" style="margin-top:10px">Planetary Periods</p>
      ${dashaBlock}
    </div>`;
}

const HOUSE_SHORT = {
  1: 'Self, identity, and personal drive',
  2: 'Wealth, speech, and family resources',
  3: 'Communication, courage, and siblings',
  4: 'Home, emotional foundation, and mother',
  5: 'Creativity, intelligence, and children',
  6: 'Service, health, and daily discipline',
  7: 'Partnerships, marriage, and contracts',
  8: 'Transformation, longevity, and hidden gains',
  9: 'Fortune, dharma, and higher learning',
  10: 'Career, authority, and public reputation',
  11: 'Income, networks, and fulfilled ambitions',
  12: 'Spirituality, expenses, and foreign connections',
};

function buildHouseGridPage(start, end, astro, c) {
  const houses = astro.houses || astro.birthChartData?.houses || {};
  const cards = [];
  for (let h = start; h <= end; h += 1) {
    const sign = houses[`house_${h}`] || houses[h] || houses[String(h)] || null;
    const inHouse = c.planets.filter((p) => Number(p.house) === h).map((p) => p.planet).join(', ');
    let text = HOUSE_SHORT[h];
    if (h === 10 && astro.careerHouseAnalysis) text = astro.careerHouseAnalysis;
    else if (inHouse) text += ` · ${inHouse} placed here.`;
    else if (sign) text += ` · Sign: ${sign}.`;
    cards.push(`<div class="house-card"><strong>House ${h}</strong><p>${text}</p></div>`);
  }
  return `
    ${sectionHeader(`Astrological Houses ${start}–${end}`)}
    <div class="content-card compact-card"><div class="house-grid">${cards.join('')}</div></div>`;
}

function buildPremiumFaceTraitMatching(c, face) {
  const traits = typeof face.personalityTraits === 'object' ? face.personalityTraits : {};
  const scores = [
    { label: 'Leadership', value: face.leadershipScore || traits.leadershipScore || 82 },
    { label: 'Teamwork', value: face.teamworkScore || traits.teamworkScore || 78 },
    { label: 'Independence', value: face.independenceScore || traits.independenceScore || 85 },
  ];

  return `
    ${sectionHeader('Face Reading Trait Matching')}
    <div class="content-card compact-card">
      <p class="section-intro">Samudrik Shastra trait scores mapped against your career profile and behavioral tendencies.</p>
      <div class="score-row">${scores.map((s) => `<div class="score-card"><span class="score-label">${s.label}</span><span class="score-value">${s.value}%</span><div class="score-bar"><div class="score-fill" style="width:${s.value}%"></div></div></div>`).join('')}</div>
      <div class="tag-row">${c.strengths.slice(0, 4).map((s) => `<span class="tag">${typeof s === 'string' ? s : s.title || s.name}</span>`).join('')}</div>
      <p>${traits.overview || face.careerRecommendations || 'Facial structure confirms logical thinking, emotional control, and professional composure under pressure.'}</p>
      <p class="panel-title">Best Fit Roles</p>
      <p>${c.career || 'Leadership, analytical, and communication-driven professional roles.'}</p>
      <p class="panel-title">Growth Areas</p>
      <div class="tag-row">${c.challenges.slice(0, 3).map((s) => `<span class="tag tag-muted">${typeof s === 'string' ? s : s.title || s.name}</span>`).join('')}</div>
    </div>`;
}

function buildCompactGalleryPage(images) {
  const galleryItems = [
    images.palmRight && { url: images.palmRight, label: 'Right Palm (Active Hand)' },
    images.palmLeft && { url: images.palmLeft, label: 'Left Palm (Innate Hand)' },
    images.faceCenter && { url: images.faceCenter, label: 'Front Face' },
    images.faceLeft && { url: images.faceLeft, label: 'Left Profile' },
    images.faceRight && { url: images.faceRight, label: 'Right Profile' },
  ].filter(Boolean);

  return `
    ${sectionHeader('All Uploaded Images')}
    <div class="content-card compact-card">
      <p class="section-intro">Every image submitted during your reading session, reproduced for verification and reference.</p>
      <div class="img-grid-2 gallery-compact">${galleryItems.length ? galleryItems.map((img) => imageFigure(img.url, img.label, '', 'premium', 'gallery')).join('') : '<p class="note">No images were found. Upload palm and face photos before generating the report.</p>'}</div>
    </div>`;
}

function buildFinalConclusionPage(c, userName) {
  return `
    ${sectionHeader('Final Expert Conclusion')}
    <div class="content-card compact-card">
      <div class="two-col">
        <div class="insight-card"><span class="insight-label">Relationships</span><p>${c.love || 'Emotional honesty and shared ambition support long-term partnership success.'}</p></div>
        <div class="insight-card"><span class="insight-label">Wellbeing</span><p>${c.health || 'Structured rest, routine, and stress management are essential during peak career cycles.'}</p></div>
      </div>
      <p class="panel-title" style="margin-top:12px">Core Strengths</p>
      <div class="tag-row">${c.strengths.slice(0, 4).map((s) => `<span class="tag">${typeof s === 'string' ? s : s.title || s.name}</span>`).join('')}</div>
      <div class="conclusion-box">
        <p>${c.conclusion || `${userName}, your chart, palm, and face analysis converge on a dynamic career path requiring mastery, consistency, and strategic decision-making.`}</p>
      </div>
    </div>`;
}

function buildExecutiveSummaryPage(c, userName) {
  const careerRows = c.careers.length
    ? c.careers.slice(0, 5).map((r, i) => `
        <div class="career-rec">
          <div class="career-rec-head"><strong>${i + 1}. ${r.title || r.role || 'Career Path'}</strong><span>Match: ${r.match || '—'}</span></div>
          <p>${r.reasoning || r.note || r.description || 'Aligned with your combined astrology, palmistry, and face reading profile.'}</p>
          ${r.salary || r.expectedSalary ? `<p class="career-meta">Expected Range: ${r.salary || r.expectedSalary}</p>` : ''}
        </div>`).join('')
    : `<p>Career recommendations will appear once your full reading analysis is saved to your profile.</p>`;

  return `
    ${sectionHeader('Executive Summary & Career Recommendations')}
    <div class="content-card pro-card">
      <p class="section-intro">Comprehensive analysis prepared for <strong>${userName}</strong>. Confidence score: <strong>${c.confidence}%</strong>.</p>
      <p>${c.conclusion || c.career || c.intro}</p>
      <p class="panel-title">Top Career Recommendations</p>
      ${careerRows}
      <p class="panel-title" style="margin-top:16px">Key Strengths</p>
      <ul class="bullet-list">${c.strengths.slice(0, 6).map((s) => `<li>${typeof s === 'string' ? s : s.title || s.name}</li>`).join('')}</ul>
      <p class="panel-title">Development Areas</p>
      <ul class="bullet-list">${c.challenges.slice(0, 4).map((s) => `<li>${typeof s === 'string' ? s : s.title || s.name}</li>`).join('')}</ul>
    </div>`;
}

function buildPlanetaryPeriodsPage(c, astro, userName) {
  let dashaItems = c.dashas.length ? c.dashas : [];

  if (!dashaItems.length && c.future?.length) {
    dashaItems = c.future.map((p, i) => ({
      planet: typeof p === 'string' ? 'Favorable Period' : p.planet || 'Favorable Period',
      period: typeof p === 'string' ? p.split(':')[0]?.trim() : p.period || p.year || '',
      effect: typeof p === 'string' ? p.split(':').slice(1).join(':').trim() : p.focus || p.milestone || '',
    }));
  }

  if (!dashaItems.length && c.planets.length) {
    dashaItems = [
      { planet: 'Current Phase', period: '2025–2027', effect: 'Skill building and professional foundation based on dominant chart placements.' },
      { planet: 'Growth Phase', period: '2027–2030', effect: 'Leadership exposure and career acceleration aligned with 10th house indicators.' },
      { planet: 'Peak Phase', period: '2030+', effect: 'Authority, business expansion, or executive recognition period.' },
    ];
  }

  const rows = dashaItems.length
    ? dashaItems.map((d) => `<tr><td>${d.planet || '—'}</td><td>${d.period || '—'}</td><td>${d.effect || '—'}</td></tr>`).join('')
    : `<tr><td colspan="3">Save your birth chart reading to populate personalized planetary periods for ${userName}.</td></tr>`;

  const planetRows = c.planets.length
    ? c.planets.map((p) => `<tr><td>${p.planet}</td><td>${p.sign || '—'}</td><td>${p.house ? `House ${p.house}` : '—'}</td><td>${p.degree !== '' ? `${p.degree}°` : '—'}</td></tr>`).join('')
    : '';

  return `
    ${sectionHeader('Planetary Periods & Birth Chart')}
    <div class="content-card pro-card">
      <p class="section-intro">Vedic dasha timeline and planetary placements for ${userName}.</p>
      <p class="panel-title">Planetary Periods (Dasha Analysis)</p>
      <table class="pro-data-table">
        <thead><tr><th>Planet / Phase</th><th>Period</th><th>Influence on Career &amp; Life</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${planetRows ? `<p class="panel-title" style="margin-top:18px">Planetary Positions in Your Chart</p>
      <table class="pro-data-table">
        <thead><tr><th>Planet</th><th>Sign</th><th>House</th><th>Degree</th></tr></thead>
        <tbody>${planetRows}</tbody>
      </table>` : ''}
      ${c.yogas.length ? `<p class="panel-title" style="margin-top:18px">Yogas Identified in Your Chart</p>${asList(c.yogas.map((y) => (typeof y === 'string' ? y : y.name || String(y))))}` : ''}
      ${c.astrologyParagraphs.slice(0, 3).map((p) => `<p>${p}</p>`).join('')}
    </div>`;
}

const HOUSE_DOMAINS = {
  1: 'personality, physical constitution, and life direction',
  2: 'wealth accumulation, speech, and family resources',
  3: 'communication, courage, skills, and sibling relationships',
  4: 'home, emotional security, education, and mother',
  5: 'intelligence, creativity, speculation, and children',
  6: 'service, health routines, competition, and daily work',
  7: 'marriage, partnerships, and business contracts',
  8: 'transformation, inheritance, research, and longevity',
  9: 'fortune, dharma, higher education, and mentors',
  10: 'career, public status, authority, and professional legacy',
  11: 'income, social networks, gains, and fulfilled ambitions',
  12: 'expenses, foreign connections, spirituality, and isolation',
};

function buildPersonalizedHousePages(c, astro, userName) {
  const houses = astro.houses || astro.birthChartData?.houses || {};
  const houseAnalysis = (h) => {
    const sign = houses[`house_${h}`] || houses[h] || houses[String(h)] || null;
    const inHouse = c.planets.filter((p) => Number(p.house) === h);
    const planetNames = inHouse.map((p) => p.planet).join(', ');

    if (h === 10 && astro.careerHouseAnalysis) {
      return `<div class="house-row"><div class="house-head"><strong>House ${h}</strong><span>${sign || '—'}</span></div><p>${astro.careerHouseAnalysis}</p></div>`;
    }

    let text = `For ${userName}, the ${h}${h === 1 ? 'st' : h === 2 ? 'nd' : h === 3 ? 'rd' : 'th'} house`;
    if (sign) text += ` is placed in ${sign}`;
    text += `, governing ${HOUSE_DOMAINS[h]}.`;
    if (planetNames) {
      text += ` ${planetNames} in this house directly influences how this life area manifests in your chart — shaping decisions, opportunities, and karmic lessons specific to your birth configuration.`;
    } else if (sign) {
      text += ` The sign of ${sign} colours the expression of this domain with its natural qualities applied to your personal circumstances.`;
    }

    return `<div class="house-row"><div class="house-head"><strong>House ${h}</strong><span>${sign || 'Pending chart data'}</span></div><p>${text}</p></div>`;
  };

  return [
    `${sectionHeader(`Your Houses 1–6 — ${userName}`)}<div class="content-card pro-card">${[1, 2, 3, 4, 5, 6].map(houseAnalysis).join('')}</div>`,
    `${sectionHeader(`Your Houses 7–12 — ${userName}`)}<div class="content-card pro-card">${[7, 8, 9, 10, 11, 12].map(houseAnalysis).join('')}</div>`,
  ];
}

function buildPalmLineDeepDive(c, palm) {
  const lines = [
    palm.fateLineAnalysis && { title: 'Fate Line (Career Path)', text: palm.fateLineAnalysis },
    palm.headLineAnalysis && { title: 'Head Line (Intellect)', text: palm.headLineAnalysis },
    palm.sunLineAnalysis && { title: 'Sun Line (Recognition)', text: palm.sunLineAnalysis },
  ].filter(Boolean);

  if (!lines.length) {
    lines.push(
      { title: 'Fate Line', text: 'Your fate line trajectory indicates self-directed career growth with increasing clarity in your late twenties.' },
      { title: 'Head Line', text: 'A deep, well-formed head line reflects analytical precision combined with creative problem-solving capacity.' },
      { title: 'Sun Line', text: 'Sun line visibility suggests recognition through consistent professional excellence and public credibility.' }
    );
  }

  return `
    ${sectionHeader('Detailed Palmistry Line Analysis')}
    <div class="content-card compact-card">
      ${lines.map((l) => `<div class="line-card"><span class="line-label">${l.title}</span><p>${l.text}</p></div>`).join('')}
      ${palm.careerRecommendations ? `<p style="margin-top:12px"><strong>Career Insight:</strong> ${palm.careerRecommendations}</p>` : ''}
    </div>`;
}

function brandCover(theme, userName) {
  return `
    <div class="cover">
      <div class="cover-band"></div>
      <div class="cover-inner cover-simple">
        ${lifeOn66Logo('report-logo-lg')}
        <p class="cover-label">${theme.badge}</p>
        <h1>Personal Astrology Report</h1>
        <p class="cover-subtitle">Integrated Analysis: Astrology · Palmistry · Face Reading · Career Strategy</p>
        <div class="cover-meta-simple">
          <p><strong>Prepared for:</strong> ${userName}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
      </div>
    </div>`;
}

function buildFaceTraitMatching(c, face, professional = false) {
  const traits = typeof face.personalityTraits === 'object' ? face.personalityTraits : {};
  const scores = [
    { label: 'Leadership', value: face.leadershipScore || traits.leadershipScore || 82 },
    { label: 'Teamwork', value: face.teamworkScore || traits.teamworkScore || 78 },
    { label: 'Independence', value: face.independenceScore || traits.independenceScore || 85 },
  ];

  if (professional) {
    return `
      ${sectionHeader('Face Reading Trait Matching')}
      <div class="content-card pro-card">
        <p class="section-intro">Physiognomy trait assessment mapped to ${c.userDetails ? 'your' : 'client'} career profile.</p>
        <table class="pro-data-table">
          <thead><tr><th>Trait</th><th>Score</th><th>Career Relevance</th></tr></thead>
          <tbody>
            ${scores.map((s) => `<tr><td>${s.label}</td><td>${s.value}%</td><td>${s.label === 'Leadership' ? 'Management and authority roles' : s.label === 'Teamwork' ? 'Collaborative and cross-functional environments' : 'Entrepreneurship and self-directed work'}</td></tr>`).join('')}
          </tbody>
        </table>
        <p style="margin-top:14px">${traits.overview || face.careerRecommendations || 'Facial structure analysis confirms logical thinking, emotional control, and professional composure under pressure.'}</p>
        <p class="panel-title" style="margin-top:14px">Matched Strengths</p>
        <ul class="bullet-list">${c.strengths.slice(0, 6).map((s) => `<li>${typeof s === 'string' ? s : s.title || s.name}</li>`).join('')}</ul>
      </div>`;
  }

  return `
    ${sectionHeader('Face Reading Trait Matching')}
    <div class="content-card">
      <p class="section-intro">Samudrik Shastra trait scores mapped against your career profile and behavioral tendencies.</p>
      <div class="score-row">${scores.map((s) => `<div class="score-card"><span class="score-label">${s.label}</span><span class="score-value">${s.value}%</span><div class="score-bar"><div class="score-fill" style="width:${s.value}%"></div></div></div>`).join('')}</div>
      <div class="tag-row">${c.strengths.slice(0, 6).map((s) => `<span class="tag">${typeof s === 'string' ? s : s.title || s.name}</span>`).join('')}</div>
      <p>${traits.overview || face.careerRecommendations || 'Facial structure confirms a balanced achiever profile with logical thinking and emotional control under pressure.'}</p>
    </div>`;
}

function buildThreeYearRoadmap(c) {
  const items = c.threeYear.length
    ? c.threeYear.map((y, i) => ({
        year: y.year || y.title || `Year ${i + 1}`,
        focus: y.milestone || y.focus || y.description || '',
      }))
    : [
        { year: 'Year 1', focus: 'Skill mastery, certification, and building professional credibility in your core sector.' },
        { year: 'Year 2', focus: 'Leadership exposure, team ownership, and visible delivery of high-impact projects.' },
        { year: 'Year 3', focus: 'Senior role transition, business scaling, or executive authority with long-term wealth building.' },
      ];

  return `
    ${sectionHeader('3-Year Career Roadmap')}
    <div class="content-card compact-card">
      ${items.map((item, i) => `
        <div class="roadmap-item">
          <span class="roadmap-step">Year ${i + 1}</span>
          <strong>${item.year}</strong>
          <p>${item.focus}</p>
        </div>`).join('')}
      ${c.future?.length ? `<p style="margin-top:12px"><strong>Astrological Timing:</strong> ${c.future.map((p) => (typeof p === 'string' ? p : `${p.period || p.year}: ${p.focus || ''}`)).join(' · ')}</p>` : ''}
    </div>`;
}

function buildImageGalleryPage(images) {
  const galleryItems = [
    images.palmRight && { url: images.palmRight, label: 'Right Palm (Active Hand)' },
    images.palmLeft && { url: images.palmLeft, label: 'Left Palm (Innate Hand)' },
    images.palmBoth && { url: images.palmBoth, label: 'Both Palms Overview' },
    images.faceCenter && { url: images.faceCenter, label: 'Front Face' },
    images.faceLeft && { url: images.faceLeft, label: 'Left Profile' },
    images.faceRight && { url: images.faceRight, label: 'Right Profile' },
    ...(images.extra || []),
  ].filter(Boolean);

  return `
    ${sectionHeader('All Uploaded Images')}
    <div class="content-card">
      <p class="section-intro">Every image submitted during your reading session, reproduced for verification and reference.</p>
      <div class="gallery-grid">${galleryItems.length ? galleryItems.map((img) => imageFigure(img.url, img.label, '', 'premium', 'gallery')).join('') : '<p class="note">No images were found. Upload palm and face photos before generating the report.</p>'}</div>
    </div>`;
}

function pageShell(body, pageNum, total, footerText, isCover = false, useTextHeader = false) {
  const header = isCover
    ? ''
    : useTextHeader
      ? `<div class="page-header"><div class="ph-left">LIFE ON66</div><div class="ph-right">Confidential Report</div></div>`
      : `<div class="page-header">${lifeOn66Logo('report-logo-sm')}<div class="ph-right">Confidential Report</div></div>`;
  return `
    <div class="page${isCover ? ' page-cover' : ''}">
      ${header}
      <div class="page-content">${body}</div>
      <div class="footer">${footerText}</div>
      <div class="page-num">Page ${pageNum} of ${total}</div>
    </div>`;
}

function buildFreePages(analysis, fullData, userName, userDetails, images) {
  const theme = TIER_META.free;
  const c = buildContent(analysis, fullData, 'free', userName, userDetails);
  const pages = [];

  pages.push(brandCover(theme, userName));

  pages.push(`
    ${sectionHeader('Astrology Deep Analysis')}
    <div class="content-card">
      ${c.astrologyParagraphs.map((p) => `<p>${p}</p>`).join('')}
    </div>`);

  pages.push(analysisPage('Palmistry Analysis — Left Hand', images.palmLeft, c.palmLeftParagraphs, 'palm'));
  pages.push(analysisPage('Palmistry Analysis — Right Hand', images.palmRight, c.palmRightParagraphs, 'palm'));
  pages.push(analysisPage('Face Reading — Front View', images.faceCenter, c.faceFrontParagraphs, 'face'));
  pages.push(analysisPage('Face Reading — Right Profile', images.faceRight, c.faceRightParagraphs, 'face'));
  pages.push(analysisPage('Face Reading — Left Profile', images.faceLeft, c.faceLeftParagraphs, 'face'));

  pages.push(careerBlueprintTable(c));

  pages.push(`
    ${sectionHeader('Final Expert Conclusion')}
    <div class="content-card">
      ${c.personality ? `<p>${c.personality}</p>` : ''}
      <div class="tag-row">${c.strengths.slice(0, 5).map((s) => `<span class="tag">${typeof s === 'string' ? s : s.title || s.name}</span>`).join('')}</div>
      <div class="conclusion-box">
        <p>${c.conclusion || `${userName} is best suited for a dynamic, skill-based career path. Focus on mastery and consistent execution.`}</p>
      </div>
      ${Array.isArray(c.remedies) && c.remedies.length ? `<p class="panel-title">Recommended Actions</p>${asList(c.remedies.slice(0, 4))}` : ''}
    </div>`);

  return { pages, theme, footer: 'LifeOn66 — Personal Astrology Report', useTextHeader: false };
}

function buildPremiumPages(analysis, fullData, userName, userDetails, images) {
  const theme = TIER_META.premium;
  const c = buildContent(analysis, fullData, 'premium', userName, userDetails);
  const astro = fullData.astrology || {};
  const palm = fullData.palmistry || {};

  const pages = [
    premiumCoverPage(userName, theme),
    buildPremiumOverviewPage(c, userName, userDetails, theme),
    buildAstrologyDeepAnalysisPage(c, astro, theme),
    buildHouseGridPage(1, 6, astro, c),
    buildHouseGridPage(7, 12, astro, c),
    embeddedAnalysisPage('Palmistry — Left Hand (Innate)', images.palmLeft, c.palmLeftParagraphs, 'palm'),
    embeddedAnalysisPage('Palmistry — Right Hand (Active)', images.palmRight, c.palmRightParagraphs, 'palm'),
    buildPalmLineDeepDive(c, palm),
    embeddedAnalysisPage('Face Reading — Front View', images.faceCenter, c.faceFrontParagraphs, 'face'),
    embeddedAnalysisPage('Face Reading — Right Profile', images.faceRight, c.faceRightParagraphs, 'face'),
    embeddedAnalysisPage('Face Reading — Left Profile', images.faceLeft, c.faceLeftParagraphs, 'face'),
    buildPremiumFaceTraitMatching(c, fullData.face || {}),
    buildThreeYearRoadmap(c),
    careerBlueprintTable(c),
    buildFinalConclusionPage(c, userName),
  ];

  return { pages, theme, footer: theme.footer, useTextHeader: true };
}

function buildProfessionalPages(analysis, fullData, userName, userDetails, images) {
  const premium = buildPremiumPages(analysis, fullData, userName, userDetails, images);
  const c = buildContent(analysis, fullData, 'professional', userName, userDetails);
  premium.theme = TIER_META.professional;
  premium.footer = 'LifeOn66 — Professional Consultation Report · Confidential';

  const extra = [
    `${sectionHeader('Extended Dashas & Yogas')}<div class="content-card pro-card">${c.dashas.length ? asList(c.dashas.map((d) => `${d.planet || ''} ${d.period || ''}: ${d.effect || ''}`)) : asList(['Jupiter Mahadasha: expansion', 'Gaja Kesari Yoga: wealth'])}</div>`,
    `${sectionHeader('Extended Remedies')}<div class="content-card pro-card">${asList(Array.isArray(c.remedies) ? c.remedies : ['Saturday discipline', 'Philanthropy', 'Exercise'])}</div>`,
  ];

  return { pages: [...premium.pages, ...extra], theme: premium.theme, footer: premium.footer, useTextHeader: premium.useTextHeader };
}

function buildPagesForTier(analysis, fullData, tier, userName, userDetails, images) {
  if (tier === 'premium') return buildPremiumPages(analysis, fullData, userName, userDetails, images);
  if (tier === 'professional') return buildProfessionalPages(analysis, fullData, userName, userDetails, images);
  return buildFreePages(analysis, fullData, userName, userDetails, images);
}

function createHTMLContent(analysis, language, fullData, tier, userName, userDetails = {}, resolvedImages = null) {
  const { collectAllImages } = require('../utils/imageResolver');
  reportLogoSrc = getReportLogoDataUrl();
  const images = resolvedImages || collectAllImages(fullData);
  const fontFamily = language === 'hi'
    ? "'Segoe UI', 'Noto Sans Devanagari', sans-serif"
    : "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif";
  const serifFamily = "Georgia, 'Times New Roman', 'Segoe UI', serif";
  const { pages, theme, footer, useTextHeader } = buildPagesForTier(analysis, fullData, tier, userName, userDetails, images);
  const total = pages.length;
  const styledPages = pages.map((body, i) => pageShell(body, i + 1, total, footer, i === 0, useTextHeader)).join('');
  const accent = theme.accent || '#1e3a5f';
  const accentSoft = theme.accentSoft || '#eef2ff';
  const accentGold = theme.accentGold || accent;
  const logoVar = reportLogoSrc
    ? `--logo-url: url("${reportLogoSrc.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}");`
    : '';

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8" />
  <style>
    :root {
      ${logoVar}
      --ink: #0f172a;
      --ink-muted: #475569;
      --ink-light: #64748b;
      --border: #e2e8f0;
      --surface: #f8fafc;
      --accent: ${accent};
      --accent-soft: ${accentSoft};
      --accent-gold: ${accentGold};
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 0; }
    body { font-family: ${fontFamily}; color: var(--ink); background: #fff; width: 210mm; margin: 0 auto; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

    .page { width: 210mm; height: 297mm; max-height: 297mm; position: relative; page-break-after: always; page-break-inside: avoid; break-inside: avoid; background: #fff; display: flex; flex-direction: column; overflow: hidden; }
    .page-cover { padding: 0; }
    .page-header { display: flex; justify-content: space-between; align-items: center; padding: 8mm 14mm 0; border-bottom: 1px solid var(--border); margin-bottom: 4mm; flex-shrink: 0; }
    .ph-left { font-size: 11px; font-weight: 700; letter-spacing: 1.2px; color: var(--accent); text-transform: uppercase; }
    .ph-right { font-size: 10px; color: var(--ink-light); letter-spacing: 0.5px; }
    .page-content { flex: 1; padding: 0 14mm 16mm; overflow: hidden; max-height: calc(297mm - 22mm); }

    .cover { position: relative; overflow: hidden; }
    .cover-band { height: 10mm; background: linear-gradient(90deg, var(--accent) 0%, var(--accent-gold) 100%); width: 100%; }
    .cover-watermark { position: absolute; right: -20mm; top: 40mm; font-size: 180px; font-weight: 900; color: var(--accent); opacity: 0.04; line-height: 1; pointer-events: none; font-family: 'Playfair Display', serif; }
    .cover-inner { padding: 14mm 14mm 12mm; min-height: calc(297mm - 10mm); display: flex; flex-direction: column; position: relative; z-index: 1; }
    .brand-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10mm; }
    .cover-divider { width: 48px; height: 4px; background: linear-gradient(90deg, var(--accent), var(--accent-gold)); border-radius: 2px; margin-bottom: 10mm; }
    .cover-simple { justify-content: center; text-align: center; min-height: calc(297mm - 10mm); }
    .cover-brand { font-size: 28px; margin-bottom: 8mm; }
    .cover-label { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); margin-bottom: 8px; }
    .cover-meta-simple { margin-top: 14mm; font-size: 14px; color: var(--ink-muted); line-height: 1.9; }

    .cover-pro { padding: 14mm; min-height: calc(297mm - 2mm); display: flex; flex-direction: column; border-top: 3px solid var(--accent); }
    .cover-pro-top { margin-bottom: 10mm; }
    .report-logo img { height: 40px; width: auto; display: block; }
    .brand-mark { background: var(--logo-url) no-repeat center / contain; display: block; }
    .report-logo-lg.brand-mark { width: 220px; height: 88px; margin: 0 auto; }
    .report-logo-sm.brand-mark { width: 120px; height: 32px; }
    .report-logo.brand-mark { width: 140px; height: 40px; }
    .cover-pro-label { font-size: 10px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: var(--ink-light); margin-bottom: 8px; }
    .cover-pro-title { font-family: ${serifFamily}; font-size: 32px; font-weight: 700; color: var(--ink); line-height: 1.2; margin-bottom: 8px; }
    .cover-pro-sub { font-size: 13px; color: var(--ink-muted); margin-bottom: 14mm; line-height: 1.6; }
    .cover-pro-inclusions { margin: 10mm 0; padding: 14px 16px; border: 1px solid var(--border); background: var(--surface); border-radius: 6px; }
    .cover-pro-summary { margin-top: 8mm; padding-top: 8mm; border-top: 1px solid var(--border); }
    .cover-pro-summary p { font-size: 13px; line-height: 1.75; color: var(--ink-muted); }
    .cover-confidence { margin-top: 8px; font-size: 13px; color: var(--ink); }
    .cover-pro-footer { margin-top: auto; padding-top: 10mm; font-size: 9px; color: var(--ink-light); border-top: 1px solid var(--border); }

    .compact-card { padding: 12px 14px; }
    .compact-card p { font-size: 12.5px; line-height: 1.6; margin-bottom: 8px; }
    .compact-line { font-size: 12.5px; line-height: 1.55; color: var(--ink-muted); margin-bottom: 6px; }
    .premium-meta-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
    .stat-value-sm { font-size: 15px !important; }
    .tag-muted { background: #f1f5f9; border-color: #e2e8f0; color: var(--ink-muted); }
    .gallery-compact .gallery-frame { max-height: 130px; min-height: 100px; }
    .gallery-compact .img-figure { margin-bottom: 8px; }
    .gallery-compact .cap-label { font-size: 10px; }

    .pro-card { box-shadow: none; border-radius: 8px; padding: 20px 22px; border: 1px solid var(--border); }
    .pro-table { margin: 8px 0 12px; }
    .pro-data-table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 8px 0 12px; }
    .pro-data-table th, .pro-data-table td { border: 1px solid var(--border); padding: 9px 11px; text-align: left; vertical-align: top; }
    .pro-data-table th { background: #f8fafc; color: var(--ink); font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.6px; }
    .pro-data-table td { color: var(--ink-muted); line-height: 1.6; }
    .pro-conclusion { background: #fff; border-left: 3px solid var(--accent); }

    .house-row { padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
    .house-row:last-child { border-bottom: none; }
    .house-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
    .house-head strong { font-size: 13px; color: var(--ink); }
    .house-head span { font-size: 12px; color: var(--ink-light); font-weight: 600; }
    .house-row p { margin: 0; font-size: 13px; line-height: 1.75; color: var(--ink-muted); }

    .cover-inclusions { margin-top: 12mm; text-align: left; }
    .house-meaning { font-size: 12px; color: var(--ink-light); margin-top: 4px; }

    .line-card { padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
    .line-card:last-child { border-bottom: none; }
    .line-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--accent); margin-bottom: 6px; }
    .line-card p { margin: 0; font-size: 14px; line-height: 1.8; color: var(--ink-muted); }

    .score-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .score-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 14px; text-align: center; }
    .score-label { display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--ink-light); }
    .score-value { display: block; font-size: 22px; font-weight: 800; color: var(--accent); margin: 6px 0; }
    .score-bar { height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
    .score-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent-gold)); border-radius: 3px; }

    .roadmap-item { padding: 14px 0; border-bottom: 1px solid #f1f5f9; }
    .roadmap-item:last-child { border-bottom: none; }
    .roadmap-step { display: inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--ink-light); background: #f8fafc; border: 1px solid var(--border); padding: 3px 10px; border-radius: 2px; margin-bottom: 6px; }
    .roadmap-item strong { display: block; font-size: 15px; color: var(--ink); margin-bottom: 4px; }
    .roadmap-item p { margin: 0; font-size: 14px; line-height: 1.75; color: var(--ink-muted); }

    .embedded-analysis-page { padding: 10px 12px; }
    .embedded-hero { border: 1px solid var(--border); border-radius: 6px; background: var(--surface); padding: 8px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .embedded-hero.palm { height: 150px; max-height: 150px; }
    .embedded-hero.face { height: 170px; max-height: 170px; }
    .embedded-hero img { width: 100%; height: 100%; max-height: 100%; object-fit: contain; display: block; }
    .embedded-missing { min-height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 10px; }
    .embedded-analysis-page .analysis-text p { font-size: 12px; line-height: 1.55; margin-bottom: 6px; }

    .analysis-page { padding: 16px 18px; }
    .hero-image { border: 1px solid var(--border); border-radius: 8px; background: var(--surface); padding: 12px; margin-bottom: 16px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .hero-image.palm { min-height: 280px; max-height: 340px; }
    .hero-image.face { min-height: 320px; max-height: 400px; }
    .hero-image img { width: 100%; height: 100%; max-height: 380px; object-fit: contain; display: block; }
    .hero-missing { min-height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .analysis-text p { font-size: 14px; line-height: 1.85; color: var(--ink-muted); margin-bottom: 10px; }

    .career-rec { padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
    .career-rec:last-child { border-bottom: none; }
    .career-rec-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; font-size: 14px; }
    .career-rec-head span { font-size: 12px; color: var(--accent); font-weight: 700; }
    .career-rec p { margin: 0; font-size: 13px; line-height: 1.75; color: var(--ink-muted); }
    .career-meta { margin-top: 4px; font-size: 12px; color: var(--ink-light); }

    .career-table th, .career-table td { border: 1px solid var(--border); padding: 10px 12px; text-align: left; }
    .career-table th { background: var(--surface); color: var(--accent); font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
    .career-note { margin-top: 12px; font-size: 14px; line-height: 1.75; color: var(--ink); font-weight: 500; }
    .brand-logo { font-size: 22px; font-weight: 800; color: var(--ink); letter-spacing: -0.5px; }
    .brand-logo span { color: var(--accent); }
    .badge { font-size: 11px; font-weight: 600; color: var(--accent); background: var(--accent-soft); border: 1px solid #c7d2fe; padding: 6px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.6px; }
    .tier-name { font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--ink-light); margin-bottom: 10px; }
    h1 { font-family: ${serifFamily}; font-size: 40px; line-height: 1.15; color: var(--ink); margin-bottom: 12px; font-weight: 700; max-width: 90%; }
    .cover-subtitle { font-size: 16px; color: var(--ink-muted); line-height: 1.65; max-width: 85%; margin-bottom: 14mm; }
    .cover-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10mm; }
    .meta-block { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 14px 16px; }
    .meta-label { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--ink-light); font-weight: 600; margin-bottom: 6px; }
    .meta-value { display: block; font-size: 15px; font-weight: 700; color: var(--ink); }
    .inclusions-panel { margin-top: auto; border: 1px solid var(--border); border-radius: 8px; padding: 18px 20px; background: var(--surface); }
    .panel-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--accent); margin-bottom: 12px; }

    .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 2px solid var(--accent); }
    .section-num { font-size: 22px; font-weight: 800; color: var(--accent); line-height: 1; min-width: 32px; }
    .section-title { font-size: 15px; font-weight: 700; color: var(--ink); text-transform: uppercase; letter-spacing: 0.5px; }

    .content-card { background: #fff; border: 1px solid var(--border); border-radius: 8px; padding: 20px 22px; box-shadow: 0 1px 3px rgba(15,23,42,0.04); }
    .content-card p, .lead-text { font-size: 14px; line-height: 1.8; color: var(--ink-muted); margin-bottom: 12px; }
    .lead-text { font-size: 15px; color: var(--ink); line-height: 1.85; }
    .section-intro { font-size: 13px; color: var(--ink-light); margin-bottom: 14px; }

    .stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 18px; }
    .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 12px 14px; }
    .stat-label { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: var(--ink-light); font-weight: 600; }
    .stat-value { display: block; font-size: 20px; font-weight: 800; color: var(--accent); margin-top: 4px; }

    .details-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .details-table td { padding: 11px 8px; border-bottom: 1px solid #f1f5f9; }
    .details-table tr:last-child td { border-bottom: none; }
    .details-table td:first-child { color: var(--ink-light); width: 38%; font-weight: 500; }
    .details-table td:last-child { color: var(--ink); font-weight: 600; }

    .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
    .feature-item { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: var(--ink-muted); line-height: 1.5; }
    .check { color: var(--accent); font-weight: 800; flex-shrink: 0; }

    .toc-row { display: flex; align-items: baseline; gap: 10px; padding: 11px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .toc-num { font-weight: 800; color: var(--accent); min-width: 28px; }
    .toc-title { color: var(--ink); font-weight: 500; }
    .toc-dots { flex: 1; border-bottom: 1px dotted #cbd5e1; margin: 0 8px 3px; min-width: 20px; }
    .toc-page { font-weight: 700; color: var(--ink-light); font-size: 12px; min-width: 24px; text-align: right; }

    .img-figure { margin-bottom: 18px; break-inside: avoid; page-break-inside: avoid; }
    .img-frame {
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      background: #fff;
      padding: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 120px;
    }
    .palm-frame { aspect-ratio: 4 / 3; max-height: 240px; background: var(--surface); }
    .face-frame { aspect-ratio: 3 / 4; max-height: 320px; background: var(--surface); }
    .gallery-frame { aspect-ratio: 1 / 1; max-height: 200px; background: var(--surface); }
    .img-frame img {
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      object-position: center;
      display: block;
      image-rendering: auto;
    }
    .cap-label { font-size: 12px; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 0.5px; }
    .img-figure figcaption { margin-top: 8px; }
    .img-analysis { margin-top: 8px; font-size: 13px; line-height: 1.7; color: var(--ink-muted); padding-left: 10px; border-left: 3px solid var(--border); }
    .img-missing { padding: 28px; text-align: center; border: 1px dashed var(--border); border-radius: 6px; color: var(--ink-light); background: var(--surface); font-size: 13px; }

    .img-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .gallery-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }

    .bullet-list { margin: 8px 0 8px 18px; color: var(--ink-muted); font-size: 14px; line-height: 1.85; }
    .bullet-list li { margin-bottom: 6px; }

    .highlight-box { margin-top: 14px; padding: 14px 16px; background: var(--accent-soft); border-left: 4px solid var(--accent); border-radius: 0 6px 6px 0; font-size: 13px; color: var(--ink-muted); line-height: 1.7; }

    .tag-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
    .tag { font-size: 12px; font-weight: 600; color: var(--accent); background: var(--accent-soft); border: 1px solid #c7d2fe; padding: 5px 12px; border-radius: 20px; }

    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .insight-row { margin-top: 14px; }
    .insight-card { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 14px; }
    .insight-label { display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--accent); margin-bottom: 8px; }
    .insight-card p { font-size: 13px; margin: 0; line-height: 1.65; }

    .house-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .house-card { padding: 12px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; font-size: 13px; }
    .house-card strong { color: var(--accent); display: block; margin-bottom: 4px; font-size: 12px; }
    .house-card p { margin: 0; color: var(--ink-muted); line-height: 1.55; }

    .conclusion-box { margin-top: 16px; padding: 18px 20px; background: var(--surface); border: 1px solid var(--border); border-left: 4px solid var(--accent); border-radius: 0 8px 8px 0; }
    .conclusion-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--accent); margin-bottom: 8px; }
    .conclusion-box p:last-child { color: var(--ink); font-weight: 500; line-height: 1.75; margin: 0; }

    .upgrade-note, .note { margin-top: 14px; font-size: 12px; color: var(--ink-light); line-height: 1.6; font-style: italic; }

    .footer { position: absolute; bottom: 8mm; left: 14mm; right: 14mm; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 6px; letter-spacing: 0.3px; }
    .page-num { position: absolute; bottom: 8mm; right: 14mm; font-size: 9px; color: var(--ink-light); font-weight: 600; }
  </style>
</head>
<body>${styledPages}</body>
</html>`;
}

module.exports = { createHTMLContent, TIER_META, FREE_INCLUSIONS, PREMIUM_INCLUSIONS };
