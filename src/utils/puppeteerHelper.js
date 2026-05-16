const path = require('path');
const fs = require('fs');

/**
 * Robustly finds the Puppeteer-installed Chrome executable in the local cache.
 * This is necessary for environments like Render where the default detection might fail.
 */
const findChromeExecutable = () => {
  const localCache = path.join(process.cwd(), '.puppeteer_cache');
  console.log(`[Puppeteer] Searching in cache: ${localCache}`);
  
  if (!fs.existsSync(localCache)) {
    console.log(`[Puppeteer] Cache directory does not exist at: ${localCache}`);
    return null;
  }

  // Search for the 'chrome' binary or 'chrome-headless-shell' in the cache
  const walkSync = (dir) => {
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          const found = walkSync(filePath);
          if (found) return found;
        } else {
          // Look for common chrome binary names
          const isChromeBinary = 
            file === 'chrome' || 
            file === 'google-chrome' || 
            file === 'chrome-headless-shell' || 
            (process.platform === 'win32' && file === 'chrome.exe');
          
          if (isChromeBinary) {
            // Basic sanity check: binary should be at least a few MBs
            if (stat.size > 1024 * 1024) { 
              console.log(`[Puppeteer] Found potential binary: ${filePath} (${Math.round(stat.size / 1024 / 1024)} MB)`);
              return filePath;
            }
          }
        }
      }
    } catch (err) {
      console.error(`[Puppeteer] Error reading directory ${dir}:`, err.message);
    }
    return null;
  };

  const executable = walkSync(localCache);
  if (executable) {
    // Ensure it's executable on Linux
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

  console.log('[Puppeteer] No Chrome executable found in cache.');
  return null;
};

module.exports = { findChromeExecutable };
