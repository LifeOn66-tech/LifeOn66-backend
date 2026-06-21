const { SIGN_NAMES_HI, PLANET_ABBR } = require('./vedicAstrologyConstants');

/**
 * North Indian (diamond) Lagna Kundali — house positions fixed, signs & planets per chart.
 * House layout (standard North Indian):
 *        1
 *   12      2
 * 11          3
 * 10    9    4
 *    8    5
 *  7      6
 */
const HOUSE_LAYOUT = {
  1: { cx: 200, cy: 42, w: 90, h: 55 },
  2: { cx: 310, cy: 95, w: 75, h: 50 },
  3: { cx: 355, cy: 200, w: 55, h: 75 },
  4: { cx: 310, cy: 305, w: 75, h: 50 },
  5: { cx: 200, cy: 358, w: 90, h: 55 },
  6: { cx: 90, cy: 305, w: 75, h: 50 },
  7: { cx: 45, cy: 200, w: 55, h: 75 },
  8: { cx: 90, cy: 95, w: 75, h: 50 },
  9: { cx: 145, cy: 155, w: 65, h: 45 },
  10: { cx: 255, cy: 155, w: 65, h: 45 },
  11: { cx: 145, cy: 245, w: 65, h: 45 },
  12: { cx: 255, cy: 245, w: 65, h: 45 },
};

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function planetLabel(planet) {
  const abbr = PLANET_ABBR[planet.planet] || planet.planet?.slice(0, 2) || '?';
  const deg = planet.degreeInSign != null ? Math.floor(planet.degreeInSign) : '';
  let suffix = '';
  if (planet.retrograde) suffix += '*';
  if (planet.exalted) suffix += '↑';
  if (planet.debilitated) suffix += '↓';
  if (planet.combust) suffix += '^';
  return `${abbr}${deg ? deg : ''}${suffix}`;
}

function renderNorthIndianChart(chartData, options = {}) {
  const { dark = false } = options;
  const bg = dark ? '#0f172a' : '#fffef8';
  const line = dark ? '#c9a227' : '#1e3a5f';
  const text = dark ? '#e2e8f0' : '#1e293b';
  const signColor = dark ? '#94a3b8' : '#64748b';
  const planetColor = dark ? '#fbbf24' : '#b45309';

  const { houses, lagnaSignIndex } = chartData;
  const planetsByHouse = {};
  for (const p of chartData.planets || []) {
    const h = Number(p.house);
    if (!h) continue;
    if (!planetsByHouse[h]) planetsByHouse[h] = [];
    planetsByHouse[h].push(p);
  }

  let houseContent = '';
  for (let h = 1; h <= 12; h += 1) {
    const layout = HOUSE_LAYOUT[h];
    const signNum = ((lagnaSignIndex + h - 1) % 12) + 1;
    const signHi = SIGN_NAMES_HI[signNum - 1];
    const inHouse = planetsByHouse[h] || [];
    const planetLines = inHouse.map((p) => {
      const y = layout.cy + (inHouse.indexOf(p) - (inHouse.length - 1) / 2) * 14;
      return `<text x="${layout.cx}" y="${y + 8}" text-anchor="middle" font-size="11" font-weight="600" fill="${planetColor}">${esc(planetLabel(p))}</text>`;
    }).join('');

    houseContent += `
      <text x="${layout.cx}" y="${layout.cy - 14}" text-anchor="middle" font-size="10" fill="${signColor}">${signNum}</text>
      <text x="${layout.cx}" y="${layout.cy - 2}" text-anchor="middle" font-size="9" fill="${signColor}" opacity="0.7">${signHi}</text>
      ${planetLines}`;
  }

  const lagnaLabel = chartData.lagnaSign || SIGN_NAMES_HI[lagnaSignIndex] || '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-label="North Indian Vedic Birth Chart">
  <rect width="400" height="400" fill="${bg}" rx="8"/>
  <!-- Outer frame -->
  <rect x="20" y="20" width="360" height="360" fill="none" stroke="${line}" stroke-width="2"/>
  <!-- Diagonals -->
  <line x1="20" y1="20" x2="380" y2="380" stroke="${line}" stroke-width="1.5"/>
  <line x1="380" y1="20" x2="20" y2="380" stroke="${line}" stroke-width="1.5"/>
  <!-- Inner diamond -->
  <line x1="200" y1="20" x2="380" y2="200" stroke="${line}" stroke-width="1.5"/>
  <line x1="380" y1="200" x2="200" y2="380" stroke="${line}" stroke-width="1.5"/>
  <line x1="200" y1="380" x2="20" y2="200" stroke="${line}" stroke-width="1.5"/>
  <line x1="20" y1="200" x2="200" y2="20" stroke="${line}" stroke-width="1.5"/>
  <!-- Center cross -->
  <line x1="110" y1="110" x2="290" y2="290" stroke="${line}" stroke-width="1"/>
  <line x1="290" y1="110" x2="110" y2="290" stroke="${line}" stroke-width="1"/>
  ${houseContent}
  <text x="200" y="14" text-anchor="middle" font-size="11" font-weight="700" fill="${text}">लग्न कुंडली · ${esc(lagnaLabel)} Lagna</text>
  <text x="200" y="396" text-anchor="middle" font-size="8" fill="${signColor}">* Vakri  ↑ Uchcha  ↓ Neecha  ^ Asta</text>
</svg>`;
}

function svgToDataUrl(svg) {
  const encoded = Buffer.from(svg, 'utf8').toString('base64');
  return `data:image/svg+xml;base64,${encoded}`;
}

module.exports = { renderNorthIndianChart, svgToDataUrl };
