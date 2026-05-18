const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
const config = {};

// Only enforce the custom cache directory on Render (production/cloud)
// Render always defines process.env.RENDER to 'true'
if (process.env.NODE_ENV === 'production' || process.env.RENDER || process.cwd().includes('render')) {
  config.cacheDirectory = join(__dirname, 'puppeteer_cache');
}

module.exports = config;
