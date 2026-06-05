const puppeteer = require('puppeteer');
const { createHTMLContent } = require('./astrologyReportBuilder');
const { prepareReportImages } = require('../utils/imageResolver');

async function waitForImages(page) {
  await page.evaluate(async () => {
    const imgs = Array.from(document.images);
    await Promise.all(
      imgs.map((img) => {
        if (img.complete && img.naturalHeight > 0) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          setTimeout(resolve, 8000);
        });
      })
    );
  });
}

async function generatePDF(analysis, language, fullData, tier, userName, userDetails = {}) {
  let browser;
  try {
    const { findChromeExecutable } = require('../utils/puppeteerHelper');
    const executablePath = findChromeExecutable();

    const resolvedImages = await prepareReportImages(fullData);
    const imageCount = [
      resolvedImages.palmRight,
      resolvedImages.palmLeft,
      resolvedImages.palmBoth,
      resolvedImages.faceCenter,
      resolvedImages.faceLeft,
      resolvedImages.faceRight,
      ...(resolvedImages.extra || []).map((e) => e.url),
    ].filter(Boolean).length;

    console.log(`[PDF] Tier: ${tier} | Images resolved: ${imageCount}`);

    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--single-process',
        '--disable-software-rasterizer',
      ],
    };

    if (executablePath) {
      launchOptions.executablePath = executablePath;
    } else if (process.env.NODE_ENV === 'production' && !executablePath) {
      throw new Error(
        'Chrome Headless Shell executable not found in puppeteer_cache. Please trigger "Clear Build Cache & Deploy" on Render.'
      );
    }

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    const html = createHTMLContent(analysis, language, fullData, tier, userName, userDetails, resolvedImages);

    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await waitForImages(page);

    return await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '8mm', right: '8mm', bottom: '8mm', left: '8mm' },
    });
  } catch (error) {
    console.error('[PDF] Generation failed:', error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { generatePDF };
