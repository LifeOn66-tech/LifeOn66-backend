const FREE_INCLUSIONS = [
  '10-Page Report',
  'Basic Astrology Overview',
  'Palmistry Base Analysis',
  'Face Reading Summary',
  'All Uploaded Images Included',
  'Standard PDF Generation',
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
    tagline: 'Expanded cosmic blueprint analysis.',
    accent: '#0f766e',
    accentSoft: '#ecfdf5',
  },
  professional: {
    label: 'Cosmic Master',
    badge: 'Professional Plan',
    tagline: 'Comprehensive personalized cosmic assessment.',
    accent: '#1e293b',
    accentSoft: '#fffbeb',
    accentGold: '#b45309',
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

function buildContent(analysis = {}, fullData = {}, tier, userName, userDetails = {}) {
  const palm = fullData.palmistry || {};
  const face = fullData.face || {};
  const astro = fullData.astrology || analysis.astrology || {};
  const traits = typeof face.personalityTraits === 'object' ? face.personalityTraits : {};

  const strengths = analysis.strengthsSummary || analysis.strengths || traits.strengths || [
    'Strategic foresight', 'Leadership presence', 'Analytical depth', 'Resilience', 'Communication clarity',
  ];

  const dashas = astro.dashas || astro.planetaryPeriods || analysis.dashas || [];
  const planets = astro.planets || astro.birthChartData?.planets || analysis.planets || [];
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
    parts.push(`Key chart placements: ${planets.slice(0, 6).map((p) => `${p.planet} in ${p.sign}${p.house ? ` (House ${p.house})` : ''}`).join(', ')}.`);
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

function careerBlueprintTable(c) {
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
    ${sectionHeader('Career Blueprint')}
    <div class="content-card">
      ${phases}
      <table class="career-table">
        <thead><tr><th>Stage</th><th>Range</th><th>Focus</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="career-note">${c.career || 'Focus on mastery, consistency, and environments that reward skill and leadership.'}</p>
    </div>`;
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

function brandCover(theme, userName) {
  return `
    <div class="cover">
      <div class="cover-band"></div>
      <div class="cover-inner cover-simple">
        <div class="brand-logo cover-brand">Life<span>On66</span></div>
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

function pageShell(body, pageNum, total, footerText, isCover = false) {
  const header = isCover
    ? ''
    : `<div class="page-header"><div class="ph-left">LifeOn66</div><div class="ph-right">Confidential Report</div></div>`;
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

  return { pages, theme, footer: 'LifeOn66 — Personal Astrology Report' };
}

function buildPremiumPages(analysis, fullData, userName, userDetails, images) {
  const free = buildFreePages(analysis, fullData, userName, userDetails, images);
  free.theme = TIER_META.premium;
  free.footer = 'LifeOn66 — Astral Navigator Report';
  free.pages[0] = brandCover(TIER_META.premium, userName);
  free.pages.push(`
    ${sectionHeader('Love, Health & Strengths')}
    <div class="content-card two-col insight-row">
      <div class="insight-card"><span class="insight-label">Relationships</span><p>${buildContent(analysis, fullData, 'premium', userName).love || ''}</p></div>
      <div class="insight-card"><span class="insight-label">Wellbeing</span><p>${buildContent(analysis, fullData, 'premium', userName).health || ''}</p></div>
    </div>`);
  return free;
}

function buildProfessionalPages(analysis, fullData, userName, userDetails, images) {
  const premium = buildPremiumPages(analysis, fullData, userName, userDetails, images);
  const c = buildContent(analysis, fullData, 'professional', userName, userDetails);
  premium.theme = TIER_META.professional;
  premium.footer = 'LifeOn66 — Cosmic Master Report';
  premium.pages[0] = brandCover(TIER_META.professional, userName);

  const extra = [
    `${sectionHeader('Planetary Dashas & Yogas')}<div class="content-card">${c.dashas.length ? asList(c.dashas.map((d) => `${d.planet || ''} ${d.period || ''}: ${d.effect || ''}`)) : asList(['Jupiter Mahadasha: expansion', 'Gaja Kesari Yoga: wealth'])}</div>`,
    `${sectionHeader('Houses 1–6')}<div class="content-card house-grid">${[1, 2, 3, 4, 5, 6].map((h) => `<div class="house-card"><strong>House ${h}</strong><p>Detailed karmic significance for life domain ${h}.</p></div>`).join('')}</div>`,
    `${sectionHeader('Houses 7–12')}<div class="content-card house-grid">${[7, 8, 9, 10, 11, 12].map((h) => `<div class="house-card"><strong>House ${h}</strong><p>${h === 10 ? 'Peak career authority and public recognition.' : 'Life domain analysis.'}</p></div>`).join('')}</div>`,
    `${sectionHeader('3-Year Roadmap')}<div class="content-card">${c.threeYear.length ? asList(c.threeYear.map((y) => `${y.year || y.title}: ${y.milestone || y.focus || ''}`)) : asList(['Year 1: Mastery', 'Year 2: Leadership', 'Year 3: Scale'])}</div>`,
    `${sectionHeader('Extended Remedies')}<div class="content-card">${asList(Array.isArray(c.remedies) ? c.remedies : ['Saturday discipline', 'Philanthropy', 'Exercise'])}</div>`,
  ];

  return { pages: [...premium.pages, ...extra], theme: premium.theme, footer: premium.footer };
}

function buildPagesForTier(analysis, fullData, tier, userName, userDetails, images) {
  if (tier === 'premium') return buildPremiumPages(analysis, fullData, userName, userDetails, images);
  if (tier === 'professional') return buildProfessionalPages(analysis, fullData, userName, userDetails, images);
  return buildFreePages(analysis, fullData, userName, userDetails, images);
}

function createHTMLContent(analysis, language, fullData, tier, userName, userDetails = {}, resolvedImages = null) {
  const { collectAllImages } = require('../utils/imageResolver');
  const images = resolvedImages || collectAllImages(fullData);
  const fontFamily = language === 'hi' ? "'Noto Sans Devanagari', sans-serif" : "'Inter', 'Segoe UI', Roboto, sans-serif";
  const { pages, theme, footer } = buildPagesForTier(analysis, fullData, tier, userName, userDetails, images);
  const total = pages.length;
  const styledPages = pages.map((body, i) => pageShell(body, i + 1, total, footer, i === 0)).join('');
  const accent = theme.accent || '#1e3a5f';
  const accentSoft = theme.accentSoft || '#eef2ff';
  const accentGold = theme.accentGold || accent;

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
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

    .page { width: 210mm; min-height: 297mm; position: relative; page-break-after: always; background: #fff; display: flex; flex-direction: column; }
    .page-cover { padding: 0; }
    .page-header { display: flex; justify-content: space-between; align-items: center; padding: 10mm 14mm 0; border-bottom: 1px solid var(--border); margin-bottom: 6mm; }
    .ph-left { font-size: 11px; font-weight: 700; letter-spacing: 1.2px; color: var(--accent); text-transform: uppercase; }
    .ph-right { font-size: 10px; color: var(--ink-light); letter-spacing: 0.5px; }
    .page-content { flex: 1; padding: 0 14mm 18mm; }

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

    .analysis-page { padding: 16px 18px; }
    .hero-image { border: 1px solid var(--border); border-radius: 8px; background: var(--surface); padding: 12px; margin-bottom: 16px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .hero-image.palm { min-height: 280px; max-height: 340px; }
    .hero-image.face { min-height: 320px; max-height: 400px; }
    .hero-image img { width: 100%; height: 100%; max-height: 380px; object-fit: contain; display: block; }
    .hero-missing { min-height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .analysis-text p { font-size: 14px; line-height: 1.85; color: var(--ink-muted); margin-bottom: 10px; }

    .career-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    .career-table th, .career-table td { border: 1px solid var(--border); padding: 10px 12px; text-align: left; }
    .career-table th { background: var(--surface); color: var(--accent); font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
    .career-note { margin-top: 12px; font-size: 14px; line-height: 1.75; color: var(--ink); font-weight: 500; }
    .brand-logo { font-size: 22px; font-weight: 800; color: var(--ink); letter-spacing: -0.5px; }
    .brand-logo span { color: var(--accent); }
    .badge { font-size: 11px; font-weight: 600; color: var(--accent); background: var(--accent-soft); border: 1px solid #c7d2fe; padding: 6px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.6px; }
    .tier-name { font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--ink-light); margin-bottom: 10px; }
    h1 { font-family: 'Playfair Display', serif; font-size: 40px; line-height: 1.15; color: var(--ink); margin-bottom: 12px; font-weight: 700; max-width: 90%; }
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

module.exports = { createHTMLContent, TIER_META, FREE_INCLUSIONS };
