const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

const findChromeExecutable = () => {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const localCache = path.join(process.cwd(), 'puppeteer_cache');

  try {
    const defaultPath = puppeteer.executablePath();
    if (fs.existsSync(defaultPath) && fs.statSync(defaultPath).size > 10_000_000) {
      return defaultPath;
    }
  } catch {
    // Fall through to cache walk
  }

  if (!fs.existsSync(localCache)) {
    return null;
  }

  const foundFiles = [];
  const walkSync = (dir) => {
    try {
      for (const file of fs.readdirSync(dir)) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          walkSync(filePath);
        } else {
          foundFiles.push({ path: filePath, size: stat.size });
        }
      }
    } catch {
      // Skip unreadable directories
    }
  };

  walkSync(localCache);

  const candidate =
    foundFiles.find((f) => path.basename(f.path) === 'chrome' && f.size > 10_000_000) ||
    foundFiles.find((f) => path.basename(f.path) === 'chrome-headless-shell' && f.size > 10_000_000) ||
    foundFiles.find((f) => f.size > 20_000_000 && !f.path.endsWith('.zip'));

  if (!candidate) {
    return null;
  }

  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(candidate.path, '755');
    } catch {
      // Non-fatal on platforms that disallow chmod
    }
  }

  return candidate.path;
};

module.exports = { findChromeExecutable };
