const puppeteer = require('puppeteer');

// Translating the frontend's text translations to the backend
const translations = {
  en: {
    reportTitle: "Career & Cosmic Analysis Report",
    executiveSummary: "Executive Summary",
    astrology: "Astrology Insights",
    palmistry: "Palmistry Deep Dive",
    faceReading: "Physiognomy (Face Reading)",
    careerMatches: "Top Career Matches",
    sixMonthPlan: "6-Month Pathway",
    strengths: "Core Strengths",
    development: "Development Areas"
  },
  hi: {
    reportTitle: "करियर और ब्रह्मांडीय विश्लेषण रिपोर्ट",
    executiveSummary: "कार्यकारी सारांश",
    astrology: "ज्योतिषीय अंतर्दृष्टि",
    palmistry: "हस्तरेखा विज्ञान",
    faceReading: "मुखाकृति विज्ञान (फेस रीडिंग)",
    careerMatches: "शीर्ष करियर विकल्प",
    sixMonthPlan: "6-महीने का मार्ग",
    strengths: "मुख्य ताकतें",
    development: "विकास के क्षेत्र"
  }
};

const createHTMLContent = (analysis, language = 'en', fullData, tier = 'free', userName = 'Valued Client') => {
  const t = translations[language];
  const fontFamily = language === 'hi' ? "'Noto Sans Devanagari', sans-serif" : "'Inter', 'Segoe UI', Roboto, sans-serif";

  const lineHeight = tier === 'free' ? '2.2' : '1.8';
  const proBadge = tier === 'professional' ? 'ULTIMATE PRO MAX CONSULTANCY' : tier === 'premium' ? 'PREMIUM BLUEPRINT' : 'COSMIC EXPLORER';

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Noto+Sans+Devanagari:wght@400;600;700&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4; margin: 0; }
        body {
          font-family: ${fontFamily};
          line-height: ${lineHeight};
          color: #e2e8f0;
          background: #020617;
          width: 210mm;
          min-height: 297mm;
          position: relative;
        }
        body::before {
          content: "";
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0);
          background-size: 50px 50px;
          z-index: -1;
        }
        .cover {
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
          color: white;
          padding: 120px 60px;
          text-align: center;
          min-height: 297mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border-bottom: 15px solid #fbbf24;
        }
        .cover .badge {
          display: inline-block;
          background: #fbbf24;
          color: #000;
          padding: 8px 25px;
          border-radius: 50px;
          font-weight: 900;
          font-size: 14px;
          letter-spacing: 2px;
          margin-bottom: 40px;
          text-transform: uppercase;
        }
        .cover h1 { 
          font-family: 'Playfair Display', serif;
          font-size: 64px; 
          font-weight: 900; 
          margin-bottom: 20px; 
          line-height: 1.1;
          background: linear-gradient(to bottom, #fff 40%, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .cover h2 { font-size: 32px; font-weight: 300; color: #94a3b8; margin-bottom: 60px; }
        
        .section-header {
          background: #fbbf24;
          color: #000;
          padding: 30px 50px;
          font-size: 32px;
          font-weight: 900;
          margin: 60px 0 40px 0;
          text-transform: uppercase;
          letter-spacing: 2px;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .glass-card {
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 30px;
          padding: 50px;
          margin: 40px 50px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .milestone-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 15px;
          margin: 40px 0;
        }
        .milestone-table th { color: #fbbf24; text-transform: uppercase; font-size: 14px; letter-spacing: 1px; padding: 15px 25px; }
        .milestone-table td { background: rgba(255,255,255,0.05); padding: 25px; font-size: 18px; }
        .milestone-table td:first-child { border-radius: 15px 0 0 15px; font-weight: 800; color: #fbbf24; width: 40%; }
        .milestone-table td:last-child { border-radius: 0 15px 15px 0; text-align: right; font-weight: 700; color: #fff; }

        .expert-quote {
          border-left: 6px solid #fbbf24;
          padding: 30px 40px;
          background: rgba(251, 191, 36, 0.05);
          font-style: italic;
          font-size: 20px;
          margin: 40px 0;
          line-height: 1.8;
          color: #f1f5f9;
        }

        .img-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 40px;
          margin: 40px 0;
        }
        .img-box {
          background: #0f172a;
          padding: 15px;
          border-radius: 24px;
          border: 2px solid rgba(251,191,36,0.3);
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.8), 0 0 20px rgba(251,191,36,0.1);
          text-align: center;
        }
        .img-box img { 
          width: 100%; 
          height: 320px; 
          object-fit: cover; 
          border-radius: 16px; 
          display: block;
        }
        .img-caption {
          margin-top: 15px;
          color: #fbbf24;
          font-weight: 800;
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .footer {
          text-align: center;
          color: #475569;
          font-size: 14px;
          padding: 80px 40px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .page-break { page-break-before: always; height: 1px; }
      </style>
    </head>
    <body>
      <div class="cover">
        <div class="badge">${proBadge}</div>
        <h1>REPORT</h1>
        <h2>Integrated Analysis: Astrology • Palmistry • Face Reading • Career Strategy</h2>
        
        <div style="margin-top: 100px; padding: 40px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 30px; display: inline-block; min-width: 500px; margin-left: auto; margin-right: auto;">
          <p style="text-transform: uppercase; color: #fbbf24; letter-spacing: 4px; font-size: 14px; margin-bottom: 15px;">Prepared For</p>
          <h3 style="font-size: 42px; font-weight: 800; color: #fff;">${userName}</h3>
          <p style="margin-top: 30px; color: #64748b; font-size: 16px;">Generation Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
      </div>
      <div class="page-break"></div>
  `;

  // --- BASE SECTIONS (FREE TIER) ---
  html += `
      <div class="section-header">✦ Executive Summary</div>
      <div class="glass-card">
        <p style="font-size: 22px; color: #fbbf24; font-weight: 700; margin-bottom: 20px;">Primary Life Forces</p>
        <div class="expert-quote">
          Your energetic signature indicates a strong inclination towards analytical problem-solving and leadership. The cosmic blueprint suggests that consistent effort in a structured environment will yield the highest returns over the next 5 years.
        </div>
      </div>
      <div class="page-break"></div>

      <div class="section-header">✦ Basic Astrology & Palmistry</div>
      <div class="glass-card">
        <div class="img-grid">
          ${fullData?.palmistry?.images?.right ? `
            <div class="img-box">
              <img src="${fullData.palmistry.images.right}" />
              <div class="img-caption">Active Hand</div>
            </div>
          ` : ''}
          ${fullData?.face?.images?.center ? `
            <div class="img-box">
              <img src="${fullData.face.images.center}" />
              <div class="img-caption">Facial Structure</div>
            </div>
          ` : ''}
        </div>
        <p style="font-size: 18px; line-height: 1.8; margin-top: 30px;">
          Initial observations show a strong fate line and solid facial symmetry. These are baseline indicators of a self-made individual capable of sustained focus.
        </p>
      </div>
      <div class="page-break"></div>

      <div class="section-header">✦ 6-Month Pathway</div>
      <div class="glass-card">
        <h3 style="color: #fbbf24; font-size: 24px; margin-bottom: 20px;">Immediate Action Plan</h3>
        <table class="milestone-table">
          <thead><tr><th>Timeline</th><th style="text-align:right;">Focus Area</th></tr></thead>
          <tbody>
            <tr><td>Month 1-2</td><td>Skill Auditing & Refinement</td></tr>
            <tr><td>Month 3-4</td><td>Strategic Networking</td></tr>
            <tr><td>Month 5-6</td><td>Execution & Delivery</td></tr>
          </tbody>
        </table>
      </div>
  `;

  // --- PREMIUM & PROFESSIONAL SECTIONS ---
  if (tier === 'premium' || tier === 'professional') {
    html += `
      <div class="page-break"></div>
      <div class="section-header">✦ Full Astrological Houses</div>
      <div class="glass-card">
        <h3 style="color: #fbbf24; font-size: 24px; margin-bottom: 20px;">Detailed House Breakdown</h3>
        <div style="margin-bottom: 30px;">
          <h4 style="color: #fff; font-size: 20px; margin-bottom: 10px;">10th House (Karma & Career)</h4>
          <p style="line-height: 1.8; color: #cbd5e1;">The presence of authoritative planets here indicates a destiny tied to leadership, governance, or managing large-scale operations. Success comes through immense discipline.</p>
        </div>
        <div style="margin-bottom: 30px;">
          <h4 style="color: #fff; font-size: 20px; margin-bottom: 10px;">2nd & 11th Houses (Wealth & Gains)</h4>
          <p style="line-height: 1.8; color: #cbd5e1;">Your wealth accumulation pattern is steady rather than sudden. The 11th house signifies that your professional network is your highest-yielding asset. Cultivate mentorship.</p>
        </div>
      </div>
      <div class="page-break"></div>

      <div class="section-header">✦ Detailed Palmistry Line Analysis</div>
      <div class="glass-card">
        <p style="font-size: 18px; line-height: 1.8; margin-bottom: 20px;">
          Deep chiromancy reveals nuanced behavioral patterns. Your <strong>Head Line</strong> is distinct and long, showing deep concentration. Your <strong>Heart Line</strong> indicates you lead with logic but value deep trust in professional relationships.
        </p>
        <div class="expert-quote">
          "The absence of fragmentation on the Fate line between ages 28-35 suggests a period of intense, uninterrupted career growth. Prepare for maximum acceleration during this window."
        </div>
      </div>
      <div class="page-break"></div>

      <div class="section-header">✦ Face Reading Trait Matching</div>
      <div class="glass-card">
        <div class="img-grid">
          ${fullData?.face?.images?.left ? `
            <div class="img-box">
              <img src="${fullData.face.images.left}" />
              <div class="img-caption">Left Profile</div>
            </div>
          ` : ''}
          ${fullData?.face?.images?.right ? `
            <div class="img-box">
              <img src="${fullData.face.images.right}" />
              <div class="img-caption">Right Profile</div>
            </div>
          ` : ''}
        </div>
        <p style="font-size: 18px; line-height: 1.8; margin-top: 30px;">
          <strong>Samudrik Shastra Findings:</strong> The prominent jawline and steady gaze ratio indicate high stress tolerance. You are biologically and energetically wired for roles requiring crisis management and long-term strategic vision.
        </p>
      </div>
      <div class="page-break"></div>

      <div class="section-header">✦ 3-Year Career Roadmap</div>
      <div class="glass-card">
        <h3 style="color: #fbbf24; font-size: 24px; margin-bottom: 20px;">Extended Trajectory</h3>
        <table class="milestone-table">
          <thead><tr><th>Year</th><th style="text-align:right;">Expected Milestone</th></tr></thead>
          <tbody>
            <tr><td>Year 1</td><td>Establishing Authority & Technical Depth</td></tr>
            <tr><td>Year 2</td><td>Lateral Expansion & Mentorship</td></tr>
            <tr><td>Year 3</td><td>Leadership Transition & Wealth Scaling</td></tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // --- PROFESSIONAL TIER ONLY SECTIONS ---
  if (tier === 'professional') {
    html += `
      <div class="page-break"></div>
      <div class="section-header">✦ Planetary Dosha & Yoga Analysis</div>
      <div class="glass-card">
        <h3 style="color: #fbbf24; font-size: 24px; margin-bottom: 20px;">Cosmic Multipliers & Bottlenecks</h3>
        <p style="font-size: 18px; line-height: 1.8; margin-bottom: 20px;">
          Advanced planetary scanning reveals the presence of specific <strong>Yogas</strong> (positive combinations) that act as multipliers for your wealth, and minor <strong>Doshas</strong> (afflictions) that require mitigation.
        </p>
        <div style="background: rgba(255,255,255,0.02); padding: 30px; border-radius: 15px; margin-bottom: 20px;">
          <h4 style="color: #4ade80; margin-bottom: 10px;">Raj Yoga Indicator</h4>
          <p>The alignment of trine lords indicates significant success in the second half of life. Political or corporate influence is highly favored.</p>
        </div>
        <div style="background: rgba(255,255,255,0.02); padding: 30px; border-radius: 15px;">
          <h4 style="color: #f87171; margin-bottom: 10px;">Mitigation (Remedy)</h4>
          <p>To avoid burnout caused by overactive Mars energy, implement strict physical exercise routines and avoid impulsive financial investments during eclipses.</p>
        </div>
      </div>
      <div class="page-break"></div>

      <div class="section-header">✦ Day-by-Day Action Plans</div>
      <div class="glass-card">
        <h3 style="color: #fbbf24; font-size: 24px; margin-bottom: 20px;">Daily Execution Protocol</h3>
        <div class="expert-quote">
          "The difference between a cosmic blueprint and reality is daily execution. Here is your biologically optimized daily structure."
        </div>
        <ul style="list-style: none; font-size: 18px; line-height: 2;">
          <li style="margin-bottom: 15px;"><strong style="color: #fbbf24;">Morning (Creation):</strong> 6:00 AM - 9:00 AM. Deep analytical work. No meetings.</li>
          <li style="margin-bottom: 15px;"><strong style="color: #fbbf24;">Mid-Day (Expansion):</strong> 11:00 AM - 3:00 PM. High-stakes communication, networking, and leadership.</li>
          <li style="margin-bottom: 15px;"><strong style="color: #fbbf24;">Evening (Synthesis):</strong> 5:00 PM - 7:00 PM. Review, strategic planning, and skill acquisition.</li>
        </ul>
      </div>
      <div class="page-break"></div>

      <div class="section-header">✦ Micro-Milestones Roadmap</div>
      <div class="glass-card">
        <h3 style="color: #fbbf24; font-size: 24px; margin-bottom: 20px;">Quarterly Granular Tracking</h3>
        <table class="milestone-table" style="font-size: 16px;">
          <thead><tr><th>Quarter</th><th style="text-align:right;">Key Objective</th></tr></thead>
          <tbody>
            <tr><td>Q1</td><td>Complete 2 advanced technical certifications. Secure 1 major win.</td></tr>
            <tr><td>Q2</td><td>Expand internal network. Pitch 1 strategic idea to leadership.</td></tr>
            <tr><td>Q3</td><td>Mentorship phase. Guide 2 junior peers. Consolidate authority.</td></tr>
            <tr><td>Q4</td><td>Salary renegotiation/promotion pivot based on Q1-Q3 metrics.</td></tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // --- FOOTER (ALL TIERS) ---
  html += `
      <div class="page-break"></div>
      <div class="section-header">✦ Final Expert Conclusion</div>
      <div class="glass-card">
        <div class="expert-quote" style="background: rgba(251, 191, 36, 0.1); border-color: #fbbf24;">
          <strong>Strategic Recommendation for ${userName}:</strong><br/><br/>
          The strongest success pattern identified across all biological and celestial indicators is:<br/><br/>
          <span style="font-size: 24px; color: #fff; font-weight: 800;">Tech → Corporate Growth → Leadership → Business.</span>
          <br/><br/>
          <strong>CRITICAL WARNING:</strong> Avoid slow-growth environments or non-technical administrative roles in your early years. Focus on mastery and consistency. 
        </div>
        
        ${tier === 'free' ? `
        <div style="margin-top: 60px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 40px;">
          <p style="color: #94a3b8; margin-bottom: 20px;">This report is a foundational analysis.</p>
          <div style="background: #fbbf24; color: #000; padding: 20px 40px; border-radius: 50px; font-weight: 900; display: inline-block;">
            UPGRADE TO UNLOCK 3-YEAR ROADMAP & DOSHA ANALYSIS
          </div>
        </div>
        ` : ''}
      </div>
      
      <div class="footer">
        <p style="font-weight: 900; color: #fff; letter-spacing: 2px; margin-bottom: 10px;">LIFEON66 • ${proBadge}</p>
        <p>Copyright © ${new Date().getFullYear()} LifeOn66. All rights reserved.</p>
        <p style="font-size: 10px; margin-top: 20px; color: #334155;">Disclaimer: This analysis is based on ancient interpretive sciences and should be used as guidance for self-reflection.</p>
      </div>
    </body>
    </html>
  `;

  return html;
};

exports.generatePDFBuffer = async (analysis, language, fullData, tier, userName) => {
  const htmlContent = createHTMLContent(analysis, language, fullData, tier, userName);

  // Launch Puppeteer headless browser
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'] // Disable web security helps bypass complex CORS if necessary
  });

  const page = await browser.newPage();
  
  // Set content and wait for images to load perfectly
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  // Generate PDF
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0px',
      right: '0px',
      bottom: '0px',
      left: '0px'
    }
  });

  await browser.close();
  
  return pdfBuffer;
};
