/**
 * Generates sample Final Astrology Report PDFs for local preview.
 * Run: node scratch/generate-demo-pdf.js
 * Output: demo-reports/LifeOn66_Report_<tier>.pdf
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { generatePDF } = require('../src/services/pdfGeneratorService');
const { createHTMLContent } = require('../src/services/astrologyReportBuilder');

const OUT_DIR = path.join(process.cwd(), 'demo-reports');

const sampleImages = {
  palmRight: 'https://picsum.photos/seed/palmright/600/400',
  palmLeft: 'https://picsum.photos/seed/palmleft/600/400',
  faceCenter: 'https://picsum.photos/seed/facecenter/600/800',
  faceLeft: 'https://picsum.photos/seed/faceleft/600/800',
  faceRight: 'https://picsum.photos/seed/faceright/600/800',
};

const fullData = {
  palmistry: {
    images: {
      right: sampleImages.palmRight,
      left: sampleImages.palmLeft,
    },
    fateLineAnalysis:
      'Your fate line runs clearly toward the middle finger, indicating a self-directed career path with strong momentum in your early thirties.',
    headLineAnalysis:
      'The head line is long and well-defined, showing analytical depth and capacity for sustained focus on complex problems.',
    sunLineAnalysis:
      'A visible sun line suggests recognition and success following consistent professional effort.',
    careerRecommendations: 'Technology leadership, consulting, and entrepreneurship align strongly.',
  },
  face: {
    images: {
      center: sampleImages.faceCenter,
      left: sampleImages.faceLeft,
      right: sampleImages.faceRight,
    },
    careerRecommendations:
      'Facial symmetry and jawline strength indicate resilience, leadership presence, and high stress tolerance in demanding roles.',
    personalityTraits: {
      overview: 'You combine strategic calm with decisive action under pressure.',
    },
  },
  astrology: {
    careerHouseAnalysis:
      'Strong 10th house emphasis indicates high professional status, public visibility, and leadership potential over the next decade.',
    careerRecommendations: 'Executive management, politics, or scalable entrepreneurship.',
    favorablePeriods: ['2026–2028: Major expansion', '2030–2035: Peak recognition'],
    dashas: [{ planet: 'Jupiter', period: '2024–2040', effect: 'Expansion, mentorship, and wealth growth' }],
    yogas: ['Gaja Kesari Yoga: Intelligence and lasting reputation'],
    planets: [
      { planet: 'Sun', sign: 'Leo', house: 10 },
      { planet: 'Moon', sign: 'Cancer', house: 9 },
      { planet: 'Jupiter', sign: 'Sagittarius', house: 2 },
    ],
  },
};

const analysis = {
  confidenceScore: 93,
  synthesizedRecommendation:
    'Your strongest success pattern is Tech → Corporate Growth → Leadership → Business. Avoid low-growth administrative roles early in your career.',
  strengthsSummary: [
    'Strategic vision',
    'Leadership presence',
    'Analytical depth',
    'Resilience under pressure',
    'Clear communication',
  ],
  developmentAreas: ['Delegation', 'Patience with slow processes', 'Work-life balance'],
  topCareerPaths: [
    { title: 'Technology Director', match: '94%', reasoning: 'Aligns with chart and palm indicators' },
    { title: 'Management Consultant', match: '89%' },
    { title: 'Startup Founder', match: '86%' },
  ],
  loveAnalysis:
    'Venus influence suggests you value loyalty and depth. Partnerships thrive when both ambition and emotional safety are honored.',
  healthInsights:
    'Maintain structured sleep and morning routines. Stress manifests in shoulders during peak workload cycles.',
  sixMonthPathway: [
    { month: 'Month 1–2', focus: 'Skill audit and personal branding' },
    { month: 'Month 3–4', focus: 'Strategic networking' },
    { month: 'Month 5–6', focus: 'Execution and visible delivery' },
  ],
  threeYearPathway: [
    { year: 'Year 1', milestone: 'Establish authority and technical depth' },
    { year: 'Year 2', milestone: 'Leadership transition and team building' },
    { year: 'Year 3', milestone: 'Innovation, scale, and wealth acceleration' },
  ],
  remedies: [
    'Morning deep-work block before meetings',
    'Thursday Jupiter gratitude practice',
    'Quarterly skill certification',
    'Avoid impulsive investments during eclipses',
  ],
};

const userDetails = {
  dateOfBirth: '15 August 1998',
  timeOfBirth: '06:30 AM',
  placeOfBirth: 'New Delhi, India',
};

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const tiers = process.argv[2] ? [process.argv[2]] : ['free', 'premium', 'professional'];

  for (const tier of tiers) {
    console.log(`Generating ${tier} report...`);

    const html = createHTMLContent(analysis, 'en', fullData, tier, 'Demo User', userDetails);
    const htmlPath = path.join(OUT_DIR, `LifeOn66_Report_${tier}.html`);
    fs.writeFileSync(htmlPath, html);
    console.log(`Saved HTML preview: ${htmlPath}`);

    try {
      const buffer = await generatePDF(analysis, 'en', fullData, tier, 'Demo User', userDetails);
      const filePath = path.join(OUT_DIR, `LifeOn66_Report_${tier}.pdf`);
      fs.writeFileSync(filePath, buffer);
      console.log(`Saved PDF: ${filePath} (${(buffer.length / 1024).toFixed(1)} KB)`);
    } catch (pdfErr) {
      console.warn(`PDF skipped for ${tier}: ${pdfErr.message}`);
      console.warn('Open the .html file in Chrome to preview layout and images.');
    }
  }

  console.log(`\nOpen folder: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error('Demo PDF generation failed:', err.message);
  console.error('\nTip: Run "npm run postinstall" if Chrome/Puppeteer is missing locally.');
  process.exit(1);
});
