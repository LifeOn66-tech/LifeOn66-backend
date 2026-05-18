const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Only run the native Linux installer on Render (production/cloud)
if (process.env.NODE_ENV === 'production' || process.env.PORT || process.cwd().includes('render')) {
  const cacheDir = path.join(process.cwd(), 'puppeteer_cache');
  console.log('[Installer] Starting production Chrome Headless Shell installation...');
  console.log('[Installer] Cache directory:', cacheDir);

  try {
    // Ensure cache directory exists and is clean
    if (fs.existsSync(cacheDir)) {
      console.log('[Installer] Cleaning old cache...');
      fs.rmSync(cacheDir, { recursive: true, force: true });
    }
    fs.mkdirSync(cacheDir, { recursive: true });

    const version = "148.0.7778.97";
    const url = `https://storage.googleapis.com/chrome-for-testing-public/${version}/linux64/chrome-headless-shell-linux64.zip`;
    const zipPath = path.join(cacheDir, 'chrome-headless-shell.zip');

    console.log(`[Installer] Downloading chrome-headless-shell v${version} using curl...`);
    execSync(`curl -L -f -o "${zipPath}" "${url}"`, { stdio: 'inherit' });

    console.log('[Installer] Extracting zip using native unzip (0 RAM overhead)...');
    execSync(`unzip -o -q "${zipPath}" -d "${cacheDir}"`, { stdio: 'inherit' });

    console.log('[Installer] Cleaning up zip file...');
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }

    console.log('[Installer] Verification:');
    const files = fs.readdirSync(cacheDir, { recursive: true });
    console.log('[Installer] Extracted files:', files.slice(0, 10));

    console.log('[Installer] Chrome Headless Shell successfully installed!');
  } catch (error) {
    console.error('[Installer] CRITICAL ERROR during installation:', error.message);
    process.exit(1);
  }
} else {
  console.log('[Installer] Local environment detected. Skipping production Chrome installation.');
}
