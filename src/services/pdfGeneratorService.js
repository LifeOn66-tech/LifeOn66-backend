const puppeteer = require('puppeteer');
const { createHTMLContent } = require('./astrologyReportBuilder');
const { prepareReportImages } = require('../utils/imageResolver');
const { findChromeExecutable } = require('../utils/puppeteerHelper');

const PDF_TIMEOUT_MS = Number(process.env.PDF_TIMEOUT_MS) || 90000;
const IMAGE_WAIT_MS = 3000;
const LAUNCH_TIMEOUT_MS = 30000;

let sharedBrowser = null;
let browserLaunchPromise = null;

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)),
        ms
      )
    ),
  ]);
}

function getLaunchArgs() {
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
  ];
  // Linux-only flags — on Windows these can hang Chrome indefinitely
  if (process.env.NODE_ENV === 'production') {
    args.push('--no-zygote', '--single-process', '--disable-software-rasterizer');
  }
  return args;
}

async function getBrowser() {
  if (sharedBrowser?.isConnected()) {
    return sharedBrowser;
  }

  if (!browserLaunchPromise) {
    browserLaunchPromise = withTimeout(
      (async () => {
        const executablePath = findChromeExecutable();
        const launchOptions = {
          headless: true,
          args: getLaunchArgs(),
        };

        if (executablePath) {
          launchOptions.executablePath = executablePath;
        } else if (process.env.NODE_ENV === 'production') {
          throw new Error(
            'Chrome Headless Shell executable not found in puppeteer_cache. Please trigger "Clear Build Cache & Deploy" on Render.'
          );
        }

        console.log('[PDF] Launching Chrome...');
        sharedBrowser = await puppeteer.launch(launchOptions);
        sharedBrowser.on('disconnected', () => {
          sharedBrowser = null;
          browserLaunchPromise = null;
        });
        console.log('[PDF] Chrome ready');
        return sharedBrowser;
      })(),
      LAUNCH_TIMEOUT_MS,
      'Chrome launch'
    ).catch((err) => {
      browserLaunchPromise = null;
      throw err;
    });
  }

  return browserLaunchPromise;
}

async function waitForImages(page, maxWaitMs = IMAGE_WAIT_MS) {
  const result = await page.evaluate(async (timeoutMs) => {
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
              });
              resolve();
            };
            if (img.complete) {
              finish();
              return;
            }
            img.onload = finish;
            img.onerror = finish;
            setTimeout(finish, timeoutMs);
          })
      )
    );

    return report;
  }, maxWaitMs);

  const loaded = result.filter((r) => r.ok).length;
  const failed = result.filter((r) => !r.ok);
  console.log(`[PDF] Images in DOM: ${result.length}, loaded: ${loaded}, failed: ${failed.length}`);
  if (failed.length) {
    console.warn('[PDF] Failed images:', failed.map((f) => f.alt).join(', '));
  }

  return { loaded, failed: failed.length, details: result };
}

async function generatePDF(analysis, language, fullData, tier, userName, userDetails = {}) {
  const started = Date.now();
  let page;

  try {
    return await withTimeout(
      (async () => {
        const { images: resolvedImages, stats } = await prepareReportImages(fullData);
        console.log(
          `[PDF] Tier: ${tier} | Collected: ${stats.collected} | Inlined: ${stats.resolved} (${Date.now() - started}ms)`
        );

        const browser = await getBrowser();
        page = await browser.newPage();
        page.setDefaultTimeout(60000);
        page.setDefaultNavigationTimeout(60000);

        await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });

        await page.setRequestInterception(true);
        page.on('request', (req) => {
          const url = req.url();
          if (
            url.startsWith('data:') ||
            url === 'about:blank' ||
            req.resourceType() === 'document'
          ) {
            req.continue();
            return;
          }
          req.abort();
        });

        const html = createHTMLContent(
          analysis,
          language,
          fullData,
          tier,
          userName,
          userDetails,
          resolvedImages
        );

        console.log(`[PDF] Rendering HTML (${Math.round(html.length / 1024)} KB)...`);
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await waitForImages(page);

        console.log(`[PDF] Printing PDF... (${Date.now() - started}ms elapsed)`);
        const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
          preferCSSPageSize: true,
          margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
        });

        console.log(
          `[PDF] Done — ${Math.round(buffer.length / 1024)} KB in ${Date.now() - started}ms`
        );
        return buffer;
      })(),
      PDF_TIMEOUT_MS,
      'PDF generation'
    );
  } catch (error) {
    console.error('[PDF] Generation failed:', error.message);
    throw error;
  } finally {
    if (page) {
      try {
        await page.close();
      } catch {
        // Page may already be closed if browser crashed
      }
    }
  }
}

async function closeBrowser() {
  if (sharedBrowser) {
    try {
      await sharedBrowser.close();
    } catch {
      // ignore
    }
    sharedBrowser = null;
    browserLaunchPromise = null;
  }
}

process.on('SIGTERM', closeBrowser);
process.on('SIGINT', closeBrowser);

module.exports = { generatePDF, closeBrowser };
