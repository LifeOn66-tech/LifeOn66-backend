const path = require('path');
const fs = require('fs');

/**
 * Robustly finds the Puppeteer-installed Chrome executable in the local cache.
 * This is necessary for environments like Render where the default detection might fail.
 */
const findChromeExecutable = () => {
  const localCache = path.join(process.cwd(), '.puppeteer_cache');
  console.log(`[Puppeteer] Deep search in cache: ${localCache}`);
  
  if (!fs.existsSync(localCache)) {
    console.log(`[Puppeteer] Cache directory does not exist at: ${localCache}`);
    return null;
  }

  const foundFiles = [];
  
  // Search for the 'chrome' binary or 'chrome-headless-shell' in the cache
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
          
          // Look for common chrome binary names
          const isChromeBinary = 
            file === 'chrome' || 
            file === 'google-chrome' || 
            file === 'chrome-headless-shell' || 
            (process.platform === 'win32' && file === 'chrome.exe');
          
          if (isChromeBinary && stat.size > 1024 * 1024) { 
            console.log(`[Puppeteer] Found potential binary: ${filePath} (${Math.round(stat.size / 1024 / 1024)} MB)`);
          }
        }
      }
    } catch (err) {
      console.error(`[Puppeteer] Error reading directory ${dir}:`, err.message);
    }
  };

  walkSync(localCache);

  // After walking, pick the best candidate
  const candidate = foundFiles.find(f => {
    const name = path.basename(f.path);
    return (name === 'chrome' || name === 'chrome-headless-shell' || name === 'google-chrome') && f.size > 10000000; // >10MB
  });

  if (candidate) {
    const executable = candidate.path;
    if (process.platform !== 'win32') {
      try { 
        fs.chmodSync(executable, '755'); 
        console.log(`[Puppeteer] Set permissions 755 for: ${executable}`);
      } catch (e) {
        console.error(`[Puppeteer] Failed to set permissions: ${e.message}`);
      }
    }
    return executable;
  }

  console.log('[Puppeteer] No valid Chrome executable (>10MB) found in cache.');
  console.log('[Puppeteer] Files found in cache:', JSON.stringify(foundFiles.slice(0, 20), null, 2));
  return null;
};

module.exports = { findChromeExecutable };
