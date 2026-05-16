const path = require('path');
const fs = require('fs');

/**
 * Robustly finds the Puppeteer-installed Chrome executable in the local cache.
 * This is necessary for environments like Render where the default detection might fail.
 */
const findChromeExecutable = () => {
  const localCache = path.join(process.cwd(), '.puppeteer_cache');
  if (!fs.existsSync(localCache)) return null;

  // Search for the 'chrome' binary in the cache
  const walkSync = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        const found = walkSync(filePath);
        if (found) return found;
      } else {
        // Look for the main chrome executable
        const isChromeBinary = file === 'chrome' || file === 'google-chrome' || file === 'chrome-headless-shell' || (process.platform === 'win32' && file === 'chrome.exe');
        
        if (isChromeBinary) {
          // Verify it's in a 'chrome-linux64', 'chrome-headless-shell-linux64' or similar directory
          if (filePath.includes('linux64') || filePath.includes('win64')) {
            return filePath;
          }
        }
      }
    }

    return null;
  };

  try {
    const executable = walkSync(localCache);
    if (executable) {
      console.log(`[Puppeteer] Found executable at: ${executable}`);
      // Ensure it's executable on Linux
      if (process.platform !== 'win32') {
        try { fs.chmodSync(executable, '755'); } catch (e) {}
      }
      return executable;
    }
  } catch (err) {
    console.error('[Puppeteer] Error walking cache:', err.message);
  }

  return null;
};

module.exports = { findChromeExecutable };
