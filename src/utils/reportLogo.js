const fs = require('fs');
const path = require('path');

let cachedDataUrl = null;

function getReportLogoDataUrl() {
  if (cachedDataUrl) return cachedDataUrl;

  const logoPath = path.join(__dirname, '../assets/lifeon66-logo.png');
  if (!fs.existsSync(logoPath)) {
    console.warn('[Report] Logo not found at', logoPath);
    return '';
  }

  const buffer = fs.readFileSync(logoPath);
  cachedDataUrl = `data:image/png;base64,${buffer.toString('base64')}`;
  return cachedDataUrl;
}

module.exports = { getReportLogoDataUrl };
