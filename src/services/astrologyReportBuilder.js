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

function sectionHeader(title, index) {
  const num = index != null ? String(index).padStart(2, '0') : '';
  return `
    <div class="section-header">
      ${num ? `<span class="section-num">${num}</span>` : ''}
      <span class="section-title">${title}</span>
    </div>`;
}

function featureGrid(items) {
  return `<div class="feature-grid">${items.map((item) => `<div class="feature-item"><span class="check">✓</span><span>${item}</span></div>`).join('')}</div>`;
}

function statCard(label, value) {
  return `<div class="stat-card"><span class="stat-label">${label}</span><span class="stat-value">${value}</span></div>`;
}

function brandCover(theme, userName, title, subtitle, inclusions) {
  const reportId = `LO66-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  return `
    <div class="cover">
      <div class="cover-band"></div>
      <div class="cover-watermark">66</div>
      <div class="cover-inner">
        <div class="brand-row">
          <div class="brand-logo">Life<span>On66</span></div>
          <div class="badge">${theme.badge}</div>
        </div>
        <div class="cover-divider"></div>
        <p class="tier-name">${theme.label}</p>
        <h1>${title}</h1>
        <p class="cover-subtitle">${subtitle}</p>
        <div class="cover-meta">
          <div class="meta-block">
            <span class="meta-label">Prepared For</span>
            <span class="meta-value">${userName}</span>
          </div>
          <div class="meta-block">
            <span class="meta-label">Report Date</span>
            <span class="meta-value">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div class="meta-block">
            <span class="meta-label">Reference ID</span>
            <span class="meta-value">${reportId}</span>
          </div>
          <div class="meta-block">
            <span class="meta-label">Classification</span>
            <span class="meta-value">Confidential</span>
          </div>
        </div>
        ${inclusions ? `<div class="inclusions-panel"><p class="panel-title">Report Includes</p>${featureGrid(inclusions)}</div>` : ''}
        <p class="cover-footer-note">This document is generated exclusively for the named recipient. Unauthorized distribution is prohibited.</p>
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

  pages.push(brandCover(theme, userName, 'Personal Astrology Report', theme.tagline, FREE_INCLUSIONS));

  pages.push(`
    ${sectionHeader('User Details & Plan Inclusions', 1)}
    <div class="content-card">
      <div class="stats-row">${statCard('Confidence Score', `${c.confidence}%`)}${statCard('Plan', theme.label)}</div>
      <table class="details-table">
        <tr><td>Full Name</td><td>${userName}</td></tr>
        <tr><td>Date of Birth</td><td>${userDetails.dateOfBirth || '—'}</td></tr>
        <tr><td>Time of Birth</td><td>${userDetails.timeOfBirth || '—'}</td></tr>
        <tr><td>Place of Birth</td><td>${userDetails.placeOfBirth || '—'}</td></tr>
      </table>
      <p class="panel-title">Included in Your Report</p>
      ${featureGrid(FREE_INCLUSIONS)}
    </div>`);

  pages.push(`
    ${sectionHeader('Table of Contents', 2)}
    <div class="content-card toc-card">
      ${['Introduction', 'Basic Astrology Overview', 'Palmistry Base Analysis', 'Face Reading Summary', 'All Uploaded Images Gallery', 'Personality & Career Outlook', 'Final Summary'].map((s, i) => `<div class="toc-row"><span class="toc-num">${String(i + 1).padStart(2, '0')}</span><span class="toc-title">${s}</span><span class="toc-dots"></span><span class="toc-page">${String(i + 3).padStart(2, '0')}</span></div>`).join('')}
    </div>`);

  pages.push(`
    ${sectionHeader('Introduction', 3)}
    <div class="content-card">
      <div class="lead-text">${c.intro}</div>
      <div class="highlight-box"><strong>Executive Note:</strong> This document integrates Vedic astrology, palmistry, and physiognomy into one cohesive personal assessment.</div>
    </div>`);

  pages.push(`
    ${sectionHeader('Basic Astrology Overview', 4)}
    <div class="content-card">
      <p>${c.astrology}</p>
      ${images.extra.filter((img) => /astro|chart|kundli|birth/i.test(img.label)).map((img) => imageFigure(img.url, img.label, c.astrology, 'free', 'default')).join('') || ''}
    </div>`);

  pages.push(`
    ${sectionHeader('Palmistry Base Analysis', 5)}
    <div class="content-card img-grid-2">
      ${imageFigure(images.palmRight, 'Right Palm (Active Hand)', c.palmRight || c.palmBase, 'free', 'palm')}
      ${imageFigure(images.palmLeft, 'Left Palm (Innate Hand)', c.palmLeft || c.palmBase, 'free', 'palm')}
      ${images.palmBoth ? imageFigure(images.palmBoth, 'Both Palms Overview', c.palmBase, 'free', 'palm') : ''}
    </div>`);

  pages.push(`
    ${sectionHeader('Face Reading Summary', 6)}
    <div class="content-card">
      ${imageFigure(images.faceCenter, 'Front Face', c.faceFront, 'free', 'face')}
      <div class="img-grid-2">
        ${imageFigure(images.faceLeft, 'Left Profile', c.faceProfile || c.faceFront, 'free', 'face')}
        ${imageFigure(images.faceRight, 'Right Profile', c.faceProfile || c.faceFront, 'free', 'face')}
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
    ${sectionHeader('All Uploaded Images', 7)}
    <div class="content-card">
      <p class="section-intro">Every image submitted during your session is reproduced below for reference and verification.</p>
      <div class="gallery-grid">${galleryItems.map((img) => imageFigure(img.url, img.label, 'Biological marker included in your assessment.', 'free', 'gallery')).join('')}</div>
      ${!galleryItems.length ? '<p class="note">No images were found. Complete palm and face uploads before generating the report.</p>' : ''}
    </div>`);

  pages.push(`
    ${sectionHeader('Personality, Career & Outlook', 8)}
    <div class="content-card">
      ${c.personality ? `<p>${c.personality}</p>` : ''}
      <p class="panel-title">Core Strengths</p>
      <div class="tag-row">${c.strengths.slice(0, 5).map((s) => `<span class="tag">${s}</span>`).join('')}</div>
      <p>${c.career || 'Leadership and analytical roles align strongest with your profile.'}</p>
      <div class="two-col insight-row">
        <div class="insight-card"><span class="insight-label">Relationships</span><p>${c.love || 'Emotional honesty and shared ambition support long-term partnership success.'}</p></div>
        <div class="insight-card"><span class="insight-label">Wellbeing</span><p>${c.health || 'Structured rest and routine are essential during high-demand periods.'}</p></div>
      </div>
    </div>`);

  pages.push(`
    ${sectionHeader('Final Summary', 9)}
    <div class="content-card">
      <p class="panel-title">Recommended Actions</p>
      ${asList((Array.isArray(c.remedies) ? c.remedies : ['Morning discipline', 'Weekly reflection']).slice(0, 3))}
      <div class="conclusion-box">
        <p class="conclusion-label">Closing Assessment</p>
        <p>${c.conclusion || `Summary for ${userName}: focus on mastery and consistent execution of your strengths.`}</p>
      </div>
      <p class="upgrade-note">Upgrade to Premium or Professional tiers for extended house analysis, dasha timelines, and 15–25 page depth.</p>
    </div>`);

  return { pages, theme, footer: 'LifeOn66 — Cosmic Explorer Report' };
}

function buildPremiumPages(analysis, fullData, userName, userDetails, images) {
  const theme = TIER_META.premium;
  const c = buildContent(analysis, fullData, 'premium', userName, userDetails);
  const pages = [];

  pages.push(brandCover(theme, userName, 'Personal Astrology Report', theme.tagline, null));
  pages.push(`${sectionHeader('User Details', 1)}<div class="content-card"><div class="stats-row">${statCard('Confidence', `${c.confidence}%`)}${statCard('Plan', theme.label)}</div><table class="details-table"><tr><td>Name</td><td>${userName}</td></tr><tr><td>DOB</td><td>${userDetails.dateOfBirth || '—'}</td></tr><tr><td>Time</td><td>${userDetails.timeOfBirth || '—'}</td></tr><tr><td>Place</td><td>${userDetails.placeOfBirth || '—'}</td></tr></table></div>`);
  pages.push(`${sectionHeader('Introduction', 2)}<div class="content-card"><div class="lead-text">${c.intro}</div></div>`);
  pages.push(`${sectionHeader('Basic Astrology Overview', 3)}<div class="content-card"><p>${c.astrology}</p></div>`);
  pages.push(`${sectionHeader('Right Palm Analysis', 4)}<div class="content-card">${imageFigure(images.palmRight, 'Right Palm', c.palmRight, 'premium', 'palm')}</div>`);
  pages.push(`${sectionHeader('Left Palm Analysis', 5)}<div class="content-card">${imageFigure(images.palmLeft, 'Left Palm', c.palmLeft, 'premium', 'palm')}${images.palmBoth ? imageFigure(images.palmBoth, 'Both Palms', c.palmBase, 'premium', 'palm') : ''}</div>`);
  pages.push(`${sectionHeader('Front Face Analysis', 6)}<div class="content-card">${imageFigure(images.faceCenter, 'Front Face', c.faceFront, 'premium', 'face')}</div>`);
  pages.push(`${sectionHeader('Profile Face Analysis', 7)}<div class="content-card img-grid-2">${imageFigure(images.faceLeft, 'Left Profile', c.faceProfile, 'premium', 'face')}${imageFigure(images.faceRight, 'Right Profile', c.faceProfile, 'premium', 'face')}</div>`);
  pages.push(`${sectionHeader('All Uploaded Images', 8)}<div class="content-card gallery-grid">${[images.palmRight, images.palmLeft, images.faceCenter, images.faceLeft, images.faceRight, ...images.extra.map((e) => e.url)].filter(Boolean).map((url, i) => imageFigure(url, `Image ${i + 1}`, c.astrology, 'premium', 'gallery')).join('')}</div>`);
  pages.push(`${sectionHeader('Personality & Career', 9)}<div class="content-card"><div class="tag-row">${c.strengths.map((s) => `<span class="tag">${s}</span>`).join('')}</div><p>${c.career || ''}</p></div>`);
  pages.push(`${sectionHeader('Love & Health', 10)}<div class="content-card two-col insight-row"><div class="insight-card"><span class="insight-label">Love</span><p>${c.love || ''}</p></div><div class="insight-card"><span class="insight-label">Health</span><p>${c.health || ''}</p></div></div>`);
  pages.push(`${sectionHeader('Strengths & Future', 11)}<div class="content-card two-col"><div><p class="panel-title">Strengths</p>${asList(c.strengths)}</div><div><p class="panel-title">Challenges</p>${asList(c.challenges)}</div></div>`);
  pages.push(`${sectionHeader('Remedies & Conclusion', 12)}<div class="content-card">${asList(Array.isArray(c.remedies) ? c.remedies : [])}<div class="conclusion-box"><p class="conclusion-label">Final Word</p><p>${c.conclusion || ''}</p></div></div>`);

  return { pages, theme, footer: 'LifeOn66 — Astral Navigator Report' };
}

function buildProfessionalPages(analysis, fullData, userName, userDetails, images) {
  const premium = buildPremiumPages(analysis, fullData, userName, userDetails, images);
  const theme = TIER_META.professional;
  const c = buildContent(analysis, fullData, 'professional', userName, userDetails);

  premium.pages[0] = brandCover(theme, userName, 'Personal Astrology Report', theme.tagline, null);

  const extra = [
    `${sectionHeader('Planetary Dashas & Yogas', 13)}<div class="content-card">${c.dashas.length ? asList(c.dashas.map((d) => `${d.planet || ''} ${d.period || ''}: ${d.effect || ''}`)) : asList(['Jupiter Mahadasha: expansion', 'Gaja Kesari Yoga: wealth'])}</div>`,
    `${sectionHeader('Houses 1–6', 14)}<div class="content-card house-grid">${[1, 2, 3, 4, 5, 6].map((h) => `<div class="house-card"><strong>House ${h}</strong><p>Detailed karmic significance.</p></div>`).join('')}</div>`,
    `${sectionHeader('Houses 7–12', 15)}<div class="content-card house-grid">${[7, 8, 9, 10, 11, 12].map((h) => `<div class="house-card"><strong>House ${h}</strong><p>${h === 10 ? 'Peak career authority.' : 'Life domain analysis.'}</p></div>`).join('')}</div>`,
    `${sectionHeader('Advanced Chiromancy', 16)}<div class="content-card">${imageFigure(images.palmRight, 'Mount Analysis', c.palmRight, 'professional', 'palm')}</div>`,
    `${sectionHeader('Micro-Physiognomy', 17)}<div class="content-card">${imageFigure(images.faceCenter, 'Facial Zones', c.faceFront, 'professional', 'face')}</div>`,
    `${sectionHeader('3-Year Roadmap', 18)}<div class="content-card">${c.threeYear.length ? asList(c.threeYear.map((y) => `${y.year || y.title}: ${y.milestone || y.focus || ''}`)) : asList(['Year 1: Mastery', 'Year 2: Leadership', 'Year 3: Scale'])}</div>`,
    `${sectionHeader('Transits & Timing', 19)}<div class="content-card"><p>${c.planets.length ? c.planets.slice(0, 5).map((p) => `${p.planet} in ${p.sign}`).join(', ') : 'Jupiter transits favor expansion.'}</p></div>`,
    `${sectionHeader('Daily Protocol', 20)}<div class="content-card">${asList(['Morning: deep work', 'Midday: leadership', 'Evening: review'])}</div>`,
    `${sectionHeader('Extended Remedies', 21)}<div class="content-card">${asList(Array.isArray(c.remedies) ? c.remedies : ['Saturday discipline', 'Philanthropy', 'Exercise'])}</div>`,
    `${sectionHeader('Master Conclusion', 22)}<div class="content-card conclusion-box"><p class="conclusion-label">Master Verdict</p><p>${c.conclusion || `${userName}, your path is clear — execute with daily discipline.`}</p></div>`,
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
    .cover-footer-note { margin-top: 10mm; font-size: 9px; color: var(--ink-light); line-height: 1.5; border-top: 1px solid var(--border); padding-top: 8px; }
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
