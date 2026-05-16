const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

/**
 * Robustly finds the Puppeteer-installed Chrome executable in the local cache.
 */
const findChromeExecutable = () => {
  const localCache = path.join(process.cwd(), '.puppeteer_cache');
  console.log(`[Puppeteer] Deep search in cache: ${localCache}`);
  
  // Try Puppeteer's own detection first (it respects PUPPETEER_CACHE_DIR)
  try {
    const defaultPath = puppeteer.executablePath();
    if (fs.existsSync(defaultPath) && fs.statSync(defaultPath).size > 10000000) {
      console.log(`[Puppeteer] Internal detection found binary: ${defaultPath}`);
      return defaultPath;
    }
  } catch (e) {
    console.log(`[Puppeteer] Internal detection failed: ${e.message}`);
  }

  if (!fs.existsSync(localCache)) {
    console.log(`[Puppeteer] Cache directory does not exist.`);
    return null;
  }

  const foundFiles = [];
  const walkSync = (dir) => {
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          walkSync(filePath);
        } else {
          foundFiles.push({ path: filePath, size: stat.size });
          const isChromeBinary = file === 'chrome' || file === 'chrome-headless-shell' || file === 'google-chrome';
          if (isChromeBinary && stat.size > 10000000) { 
            console.log(`[Puppeteer] Found potential binary via walk: ${filePath}`);
          }
        }
      }
    } catch (err) {}
  };

  walkSync(localCache);

  // Pick best candidate: exact match 'chrome' > 'chrome-headless-shell' > anything > 10MB
  const candidate = foundFiles.find(f => path.basename(f.path) === 'chrome' && f.size > 10000000) ||
                    foundFiles.find(f => path.basename(f.path) === 'chrome-headless-shell' && f.size > 10000000) ||
                    foundFiles.find(f => f.size > 20000000 && !f.path.endsWith('.zip'));

  if (candidate) {
    const executable = candidate.path;
    if (process.platform !== 'win32') {
      try { fs.chmodSync(executable, '755'); } catch (e) {}
    }
    return executable;
  }

  console.log('[Puppeteer] No valid binary found in walk.');
  return null;
};

module.exports = { findChromeExecutable };
