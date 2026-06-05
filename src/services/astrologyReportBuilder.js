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
    accent: '#111827',
  },
  premium: {
    label: 'Astral Navigator',
    badge: 'Premium Plan',
    tagline: 'Expanded cosmic blueprint analysis.',
    accent: '#111827',
  },
  professional: {
    label: 'Cosmic Master',
    badge: 'Professional Plan',
    tagline: 'Comprehensive personalized cosmic assessment.',
    accent: '#111827',
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

function imageFigure(src, label, analysis, tier) {
  if (!src) {
    return `<div class="img-missing"><span>${label}</span><p>No image uploaded for this view.</p></div>`;
  }
  const safeSrc = src.replace(/"/g, '&quot;');
  const detail = pickTierText(
    tier,
    analysis?.slice?.(0, 280) || 'Visual markers indicate distinctive energetic patterns relevant to your life path.',
    analysis?.slice?.(0, 520) || 'Detailed analysis reveals nuanced behavioral tendencies and long-term career inclinations from your uploaded image.',
    analysis || 'Advanced analysis of line depth, mount prominence, and structural balance suggests leadership capacity and strategic foresight.'
  );
  return `
    <figure class="img-figure">
      <img src="${safeSrc}" alt="${label}" crossorigin="anonymous" />
      <figcaption><strong>${label}</strong></figcaption>
      <div class="img-analysis">${detail}</div>
    </figure>`;
}

function buildContent(analysis = {}, fullData = {}, tier, userName, userDetails = {}) {
  const palm = fullData.palmistry || {};
  const face = fullData.face || {};
  const astro = fullData.astrology || analysis.astrology || {};

  const strengths = analysis.strengthsSummary || analysis.strengths || [
    'Strategic foresight', 'Leadership presence', 'Analytical depth', 'Resilience', 'Communication clarity',
  ];

  return {
    intro: pickTierText(
      tier,
      `${userName}, welcome to your Cosmic Explorer report — a foundational reading of your astrological blueprint, palm lines, and facial structure.`,
      `Prepared exclusively for ${userName}, synthesizing celestial alignments, palm architecture, and facial physiognomy into actionable guidance.`,
      `${userName}, your cosmic signature represents a rare convergence of ambition, intuition, and discipline with a strategic multi-year roadmap.`
    ),
    palmRight: palm.fateLineAnalysis || palm.headLineAnalysis || analysis.palmistrySummary,
    palmLeft: palm.sunLineAnalysis || palm.headLineAnalysis || analysis.palmistrySummary,
    palmBase: palm.careerRecommendations || 'Your palm lines indicate self-directed growth with strong focus and resilience.',
    faceFront: face.careerRecommendations || analysis.faceSummary || 'Facial symmetry and structure reflect leadership potential and emotional intelligence.',
    faceProfile: analysis.faceProfileSummary || (typeof face.personalityTraits === 'string' ? face.personalityTraits : face.personalityTraits?.summary),
    astrology: astro.careerHouseAnalysis || analysis.synthesizedRecommendation || analysis.astrologySummary || 'Your birth chart emphasizes career houses and sustained professional growth through disciplined effort.',
    personality: analysis.personalitySummary || (typeof face.personalityTraits === 'object' ? face.personalityTraits?.overview : null),
    career: astro.careerRecommendations || palm.careerRecommendations || analysis.synthesizedRecommendation,
    love: analysis.loveAnalysis || analysis.relationshipInsights,
    health: analysis.healthInsights || analysis.healthSummary,
    strengths,
    challenges: analysis.developmentAreas || analysis.challenges || ['Delegation', 'Patience', 'Work-life balance'],
    careers: analysis.topCareerPaths || analysis.careerPaths || [],
    future: astro.favorablePeriods || analysis.favorablePeriods || analysis.bestTiming,
    remedies: analysis.remedies || analysis.actionItems,
    conclusion: analysis.synthesizedRecommendation || analysis.finalSummary,
    confidence: analysis.confidenceScore || 91,
    sixMonth: analysis.sixMonthPathway || [],
    threeYear: analysis.threeYearPathway || [],
    dashas: astro.dashas || astro.planetaryPeriods || [],
    planets: astro.planets || astro.birthChartData?.planets || [],
    yogas: astro.yogas || [],
    userDetails,
  };
}

function sectionHeader(title) {
  return `<div class="section-header"><span>${title}</span></div>`;
}

function pageShell(body, pageNum, total, theme, footerText) {
  return `
    <div class="page">
      ${body}
      <div class="footer">${footerText}</div>
      <div class="page-num">${String(pageNum).padStart(2, '0')} / ${String(total).padStart(2, '0')}</div>
    </div>`;
}

function buildFreePages(analysis, fullData, userName, userDetails, images) {
  const theme = TIER_META.free;
  const c = buildContent(analysis, fullData, 'free', userName, userDetails);
  const pages = [];

  pages.push(`
    <div class="cover">
      <div class="badge">${theme.badge}</div>
      <p class="tier-name">${theme.label}</p>
      <h1>Personal Astrology Report</h1>
      <h2>${theme.tagline}</h2>
      <div class="cover-card">
        <p class="cover-label">Prepared For</p>
        <p class="cover-name">${userName}</p>
        <p class="cover-date">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>
      <div class="inclusions-box">${asList(FREE_INCLUSIONS)}</div>
    </div>`);

  pages.push(`
    ${sectionHeader('User Details & Plan Inclusions')}
    <div class="glass-card">
      <table class="details-table">
        <tr><td>Full Name</td><td>${userName}</td></tr>
        <tr><td>Date of Birth</td><td>${userDetails.dateOfBirth || '—'}</td></tr>
        <tr><td>Time of Birth</td><td>${userDetails.timeOfBirth || '—'}</td></tr>
        <tr><td>Place of Birth</td><td>${userDetails.placeOfBirth || '—'}</td></tr>
        <tr><td>Plan</td><td>${theme.label} (Free)</td></tr>
      </table>
      <h3>Your Free Report Includes</h3>
      ${asList(FREE_INCLUSIONS)}
    </div>`);

  pages.push(`
    ${sectionHeader('Table of Contents')}
    <div class="glass-card toc">
      ${['Introduction', 'Basic Astrology Overview', 'Palmistry Base Analysis', 'Face Reading Summary', 'All Uploaded Images Gallery', 'Personality & Career Outlook', 'Final Summary'].map((s, i) => `<div class="toc-row"><span>${i + 1}</span><span>${s}</span></div>`).join('')}
    </div>`);

  pages.push(`
    ${sectionHeader('Introduction')}
    <div class="glass-card">${asParagraphs([c.intro])}<div class="highlight">Analysis Confidence: <strong>${c.confidence}%</strong></div></div>`);

  pages.push(`
    ${sectionHeader('Basic Astrology Overview')}
    <div class="glass-card">
      <p>${c.astrology}</p>
      ${images.extra.filter((img) => /astro|chart|kundli|birth/i.test(img.label)).map((img) => imageFigure(img.url, img.label, c.astrology, 'free')).join('') || ''}
    </div>`);

  pages.push(`
    ${sectionHeader('Palmistry Base Analysis')}
    <div class="glass-card img-grid-2">
      ${imageFigure(images.palmRight, 'Right Palm (Active Hand)', c.palmRight || c.palmBase, 'free')}
      ${imageFigure(images.palmLeft, 'Left Palm (Innate Hand)', c.palmLeft || c.palmBase, 'free')}
      ${images.palmBoth ? imageFigure(images.palmBoth, 'Both Palms Overview', c.palmBase, 'free') : ''}
    </div>`);

  pages.push(`
    ${sectionHeader('Face Reading Summary')}
    <div class="glass-card">
      ${imageFigure(images.faceCenter, 'Front Face', c.faceFront, 'free')}
      <div class="img-grid-2">
        ${imageFigure(images.faceLeft, 'Left Profile', c.faceProfile || c.faceFront, 'free')}
        ${imageFigure(images.faceRight, 'Right Profile', c.faceProfile || c.faceFront, 'free')}
      </div>
    </div>`);

  const galleryItems = [
    images.palmRight && { url: images.palmRight, label: 'Right Palm' },
    images.palmLeft && { url: images.palmLeft, label: 'Left Palm' },
    images.palmBoth && { url: images.palmBoth, label: 'Both Palms' },
    images.faceCenter && { url: images.faceCenter, label: 'Front Face' },
    images.faceLeft && { url: images.faceLeft, label: 'Left Profile' },
    images.faceRight && { url: images.faceRight, label: 'Right Profile' },
    ...images.extra,
  ].filter(Boolean);

  pages.push(`
    ${sectionHeader('All Uploaded Images')}
    <div class="glass-card">
      <p>Every image you submitted is embedded below with its dedicated analysis section reference.</p>
      <div class="gallery-grid">${galleryItems.map((img) => imageFigure(img.url, img.label, 'Uploaded biological marker included in your cosmic assessment.', 'free')).join('')}</div>
      ${!galleryItems.length ? '<p class="note">No images were attached to this request. Re-generate after uploading palm and face photos in the app.</p>' : ''}
    </div>`);

  pages.push(`
    ${sectionHeader('Personality, Career & Outlook')}
    <div class="glass-card">
      ${c.personality ? `<p>${c.personality}</p>` : ''}
      ${asList(c.strengths.slice(0, 5))}
      <p>${c.career || 'Leadership and analytical roles align strongest with your cosmic blueprint.'}</p>
      <p>${c.love || 'Relationships benefit from emotional honesty and shared ambition.'}</p>
      <p>${c.health || 'Prioritize rest and structured routines during high-stress phases.'}</p>
    </div>`);

  pages.push(`
    ${sectionHeader('Final Summary')}
    <div class="glass-card">
      ${asList((Array.isArray(c.remedies) ? c.remedies : ['Morning discipline', 'Weekly reflection']).slice(0, 3))}
      <div class="conclusion-box"><p>${c.conclusion || `Summary for ${userName}: focus on mastery and consistent execution of your cosmic strengths.`}</p></div>
      <p class="upgrade-note">Upgrade to Astral Navigator ($5) or Cosmic Master ($10) for 15–25 pages of advanced predictions, remedies, and house-level analysis.</p>
    </div>`);

  return { pages, theme, footer: 'LifeOn66 — Cosmic Explorer Report' };
}

function buildPremiumPages(analysis, fullData, userName, userDetails, images) {
  const theme = TIER_META.premium;
  const c = buildContent(analysis, fullData, 'premium', userName, userDetails);
  const pages = [];

  pages.push(`<div class="cover"><div class="badge">${theme.badge}</div><p class="tier-name">${theme.label}</p><h1>Final Astrology Report</h1><h2>${theme.tagline}</h2><div class="cover-card"><p class="cover-name">${userName}</p></div></div>`);
  pages.push(`${sectionHeader('User Details')}<div class="glass-card"><table class="details-table"><tr><td>Name</td><td>${userName}</td></tr><tr><td>DOB</td><td>${userDetails.dateOfBirth || '—'}</td></tr><tr><td>Time</td><td>${userDetails.timeOfBirth || '—'}</td></tr><tr><td>Place</td><td>${userDetails.placeOfBirth || '—'}</td></tr></table></div>`);
  pages.push(`${sectionHeader('Introduction')}<div class="glass-card">${asParagraphs([c.intro])}</div>`);
  pages.push(`${sectionHeader('Basic Astrology Overview')}<div class="glass-card"><p>${c.astrology}</p></div>`);
  pages.push(`${sectionHeader('Right Palm Analysis')}<div class="glass-card">${imageFigure(images.palmRight, 'Right Palm', c.palmRight, 'premium')}</div>`);
  pages.push(`${sectionHeader('Left Palm Analysis')}<div class="glass-card">${imageFigure(images.palmLeft, 'Left Palm', c.palmLeft, 'premium')}${images.palmBoth ? imageFigure(images.palmBoth, 'Both Palms', c.palmBase, 'premium') : ''}</div>`);
  pages.push(`${sectionHeader('Front Face Analysis')}<div class="glass-card">${imageFigure(images.faceCenter, 'Front Face', c.faceFront, 'premium')}</div>`);
  pages.push(`${sectionHeader('Profile Face Analysis')}<div class="glass-card img-grid-2">${imageFigure(images.faceLeft, 'Left Profile', c.faceProfile, 'premium')}${imageFigure(images.faceRight, 'Right Profile', c.faceProfile, 'premium')}</div>`);
  pages.push(`${sectionHeader('All Uploaded Images')}<div class="glass-card gallery-grid">${[images.palmRight, images.palmLeft, images.faceCenter, images.faceLeft, images.faceRight, ...images.extra.map((e) => e.url)].filter(Boolean).map((url, i) => imageFigure(url, `Image ${i + 1}`, c.astrology, 'premium')).join('')}</div>`);
  pages.push(`${sectionHeader('Personality & Career')}<div class="glass-card">${asList(c.strengths)}<p>${c.career || ''}</p></div>`);
  pages.push(`${sectionHeader('Love & Health')}<div class="glass-card"><p>${c.love || ''}</p><p>${c.health || ''}</p></div>`);
  pages.push(`${sectionHeader('Strengths & Future')}<div class="glass-card two-col"><div><h3>Strengths</h3>${asList(c.strengths)}</div><div><h3>Challenges</h3>${asList(c.challenges)}</div></div>`);
  pages.push(`${sectionHeader('Remedies & Conclusion')}<div class="glass-card">${asList(Array.isArray(c.remedies) ? c.remedies : [])}<div class="conclusion-box"><p>${c.conclusion || ''}</p></div></div>`);

  return { pages, theme, footer: 'LifeOn66 — Astral Navigator Report' };
}

function buildProfessionalPages(analysis, fullData, userName, userDetails, images) {
  const premium = buildPremiumPages(analysis, fullData, userName, userDetails, images);
  const theme = TIER_META.professional;
  const c = buildContent(analysis, fullData, 'professional', userName, userDetails);

  premium.pages[0] = premium.pages[0].replace(TIER_META.premium.badge, theme.badge).replace(TIER_META.premium.label, theme.label);

  const extra = [
    `${sectionHeader('Planetary Dashas & Yogas')}<div class="glass-card">${c.dashas.length ? asList(c.dashas.map((d) => `${d.planet || ''} ${d.period || ''}: ${d.effect || ''}`)) : asList(['Jupiter Mahadasha: expansion', 'Gaja Kesari Yoga: wealth'])}</div>`,
    `${sectionHeader('Houses 1–6')}<div class="glass-card house-grid">${[1, 2, 3, 4, 5, 6].map((h) => `<div class="house-card"><strong>House ${h}</strong><p>Detailed karmic significance.</p></div>`).join('')}</div>`,
    `${sectionHeader('Houses 7–12')}<div class="glass-card house-grid">${[7, 8, 9, 10, 11, 12].map((h) => `<div class="house-card"><strong>House ${h}</strong><p>${h === 10 ? 'Peak career authority.' : 'Life domain analysis.'}</p></div>`).join('')}</div>`,
    `${sectionHeader('Advanced Chiromancy')}<div class="glass-card">${imageFigure(images.palmRight, 'Mount Analysis', c.palmRight, 'professional')}</div>`,
    `${sectionHeader('Micro-Physiognomy')}<div class="glass-card">${imageFigure(images.faceCenter, 'Facial Zones', c.faceFront, 'professional')}</div>`,
    `${sectionHeader('3-Year Roadmap')}<div class="glass-card">${c.threeYear.length ? asList(c.threeYear.map((y) => `${y.year || y.title}: ${y.milestone || y.focus || ''}`)) : asList(['Year 1: Mastery', 'Year 2: Leadership', 'Year 3: Scale'])}</div>`,
    `${sectionHeader('Transits & Timing')}<div class="glass-card"><p>${c.planets.length ? c.planets.slice(0, 5).map((p) => `${p.planet} in ${p.sign}`).join(', ') : 'Jupiter transits favor expansion.'}</p></div>`,
    `${sectionHeader('Daily Protocol')}<div class="glass-card">${asList(['Morning: deep work', 'Midday: leadership', 'Evening: review'])}</div>`,
    `${sectionHeader('Extended Remedies')}<div class="glass-card">${asList(Array.isArray(c.remedies) ? c.remedies : ['Saturday discipline', 'Philanthropy', 'Exercise'])}</div>`,
    `${sectionHeader('Master Conclusion')}<div class="glass-card conclusion-box"><p>${c.conclusion || `${userName}, your cosmic path is clear — execute with daily discipline.`}</p></div>`,
  ];

  return { pages: [...premium.pages, ...extra], theme, footer: 'LifeOn66 — Cosmic Master Report' };
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
  const styledPages = pages.map((body, i) => pageShell(body, i + 1, total, theme, footer)).join('');

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 12mm; }
    body { font-family: ${fontFamily}; color: #1f2937; background: #ffffff; width: 210mm; margin: 0 auto; }
    .page { width: 210mm; min-height: 297mm; padding: 18mm 16mm 22mm; position: relative; page-break-after: always; background: #ffffff; }
    .cover { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; min-height: 240mm; border: 1px solid #e5e7eb; border-radius: 4px; padding: 48px 40px; background: #ffffff; }
    .badge { display: inline-block; color: #374151; background: #f9fafb; border: 1px solid #d1d5db; padding: 6px 16px; border-radius: 4px; font-weight: 600; font-size: 12px; letter-spacing: 0.5px; margin-bottom: 24px; text-transform: uppercase; }
    .tier-name { color: #111827; font-size: 14px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 16px; }
    h1 { font-family: 'Playfair Display', serif; font-size: 36px; color: #111827; line-height: 1.2; margin-bottom: 12px; font-weight: 700; }
    h2 { font-size: 16px; color: #6b7280; font-weight: 400; margin-bottom: 36px; max-width: 85%; line-height: 1.6; }
    h3 { color: #111827; font-size: 13px; margin: 18px 0 8px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700; }
    .cover-card { margin-top: 40px; padding: 28px 36px; background: #f9fafb; border-radius: 4px; border: 1px solid #e5e7eb; width: 100%; max-width: 440px; }
    .inclusions-box { margin-top: 32px; text-align: left; width: 100%; max-width: 440px; padding: 20px 24px; background: #ffffff; border-radius: 4px; border: 1px solid #e5e7eb; }
    .cover-label { font-size: 11px; letter-spacing: 1.5px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
    .cover-name { font-size: 26px; font-weight: 700; color: #111827; margin: 10px 0 6px; }
    .cover-date { color: #6b7280; font-size: 14px; }
    .section-header { margin-bottom: 18px; padding-bottom: 8px; border-bottom: 2px solid #111827; }
    .section-header span { font-size: 16px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.6px; }
    .glass-card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px; padding: 24px; }
    .glass-card p { margin-bottom: 12px; line-height: 1.75; font-size: 14px; color: #374151; }
    .details-table { width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 16px; }
    .details-table td { padding: 10px 0; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
    .details-table td:first-child { color: #6b7280; width: 42%; font-weight: 500; }
    .details-table td:last-child { color: #111827; font-weight: 600; }
    .toc-row { display: flex; gap: 16px; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #374151; }
    .toc-row span:first-child { color: #111827; font-weight: 700; min-width: 24px; }
    .img-figure { margin-bottom: 20px; break-inside: avoid; }
    .img-figure img { width: 100%; max-height: 280px; min-height: 120px; object-fit: contain; background: #f9fafb; border-radius: 4px; border: 1px solid #e5e7eb; display: block; }
    .img-figure figcaption { margin-top: 10px; color: #111827; font-size: 13px; font-weight: 600; }
    .img-analysis { margin-top: 8px; font-size: 13px; line-height: 1.7; color: #4b5563; }
    .img-missing { padding: 24px; text-align: center; border: 1px dashed #d1d5db; border-radius: 4px; color: #9ca3af; margin-bottom: 14px; min-height: 80px; background: #f9fafb; font-size: 13px; }
    .img-grid-2, .gallery-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .gallery-grid { grid-template-columns: 1fr; }
    .bullet-list { margin: 10px 0 10px 20px; color: #374151; font-size: 14px; line-height: 1.8; }
    .bullet-list li { margin-bottom: 4px; }
    .highlight { margin-top: 16px; padding: 14px 16px; background: #f9fafb; border-left: 3px solid #111827; border-radius: 0 4px 4px 0; color: #374151; font-size: 14px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .house-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .house-card { padding: 14px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; font-size: 13px; color: #374151; }
    .house-card strong { color: #111827; display: block; margin-bottom: 6px; }
    .conclusion-box { padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; margin-top: 16px; }
    .conclusion-box p { color: #111827; font-weight: 500; margin-bottom: 0; }
    .upgrade-note, .note { margin-top: 16px; font-size: 12px; color: #6b7280; line-height: 1.6; }
    .footer { position: absolute; bottom: 10mm; left: 16mm; right: 16mm; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 8px; }
    .page-num { position: absolute; bottom: 10mm; right: 16mm; font-size: 10px; color: #6b7280; font-weight: 500; }
  </style>
</head>
<body>${styledPages}</body>
</html>`;
}

module.exports = { createHTMLContent, TIER_META, FREE_INCLUSIONS };
