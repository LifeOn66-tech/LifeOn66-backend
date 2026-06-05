const puppeteer = require('puppeteer');
const { createHTMLContent } = require('./astrologyReportBuilder');
const { prepareReportImages } = require('../utils/imageResolver');

async function waitForImages(page) {
  const result = await page.evaluate(async () => {
    const imgs = Array.from(document.images);
    const report = [];

    await Promise.all(
      imgs.map(
        (img) =>
          new Promise((resolve) => {
            const finish = () => {
              report.push({
                alt: img.alt || 'unnamed',
                ok: img.complete && img.naturalWidth > 0 && img.naturalHeight > 0,
                width: img.naturalWidth,
                height: img.naturalHeight,
              });
              resolve();
            };
            if (img.complete) {
              finish();
              return;
            }
            img.onload = finish;
            img.onerror = finish;
            setTimeout(finish, 12000);
          })
      )
    );

    return report;
  });

  const loaded = result.filter((r) => r.ok).length;
  const failed = result.filter((r) => !r.ok);
  console.log(`[PDF] Images in DOM: ${result.length}, loaded: ${loaded}, failed: ${failed.length}`);
  if (failed.length) {
    console.warn('[PDF] Failed images:', failed.map((f) => f.alt).join(', '));
  }

  return { loaded, failed: failed.length, details: result };
}

async function generatePDF(analysis, language, fullData, tier, userName, userDetails = {}) {
  let browser;
  try {
    const { findChromeExecutable } = require('../utils/puppeteerHelper');
    const executablePath = findChromeExecutable();

    const { images: resolvedImages, stats } = await prepareReportImages(fullData);

    console.log(`[PDF] Tier: ${tier} | Collected: ${stats.collected} | Inlined: ${stats.resolved}`);
    stats.slots.forEach((slot) => {
      if (slot.found || slot.inlined) {
        console.log(`[PDF]   ${slot.label}: found=${slot.found} inlined=${slot.inlined}`);
      }
    });

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
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });

    const html = createHTMLContent(analysis, language, fullData, tier, userName, userDetails, resolvedImages);

    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 120000 });
    await waitForImages(page);

    return await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });
  } catch (error) {
    console.error('[PDF] Generation failed:', error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { generatePDF };
