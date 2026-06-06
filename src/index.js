const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const PORT = process.env.PORT || 5000;
const MODE = process.env.NODE_ENV || 'development';
const isDev = MODE !== 'production';

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`CRITICAL ERROR: Environment variable ${envVar} is missing!`);
    process.exit(1);
  }
});

const localCache = path.join(process.cwd(), 'puppeteer_cache');

if (MODE === 'production') {
  process.env.PUPPETEER_CACHE_DIR = localCache;
} else if (isDev && !process.env.PUPPETEER_EXECUTABLE_PATH && !fs.existsSync(localCache)) {
  console.warn('[Config] Run "npm run postinstall" to download Chrome for local PDF generation.');
} else if (MODE === 'production' && !process.env.PUPPETEER_EXECUTABLE_PATH && !fs.existsSync(localCache)) {
  console.warn('[Config] Puppeteer cache not found; PDF generation may fail until Chrome is installed.');
}

connectDB();

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const allowedOrigins = [
  'https://lifeon66-frontend.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/+$/, '');
      if (
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith('.vercel.app') ||
        cleanOrigin.endsWith('.onrender.com')
      ) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    credentials: true,
    exposedHeaders: [
      'Content-Disposition',
      'Content-Length',
      'Content-Type',
      'X-Report-Generator',
      'X-Report-Tier',
      'X-Report-Pages',
      'X-Report-Duration-Ms',
    ],
  })
);

app.use((req, res, next) => {
  const legacyPaths = ['/auth', '/payments', '/readings', '/reports'];
  const segments = req.path.split('/').filter(Boolean);
  const firstPath = segments.length > 0 ? `/${segments[0]}` : '';

  if (legacyPaths.includes(firstPath) && !req.path.startsWith('/api')) {
    req.url = `/api${req.url}`;
    if (isDev) {
      console.log(`[Redirect] ${req.path} -> ${req.url}`);
    }
  }
  next();
});

app.get('/api/health-browser', async (req, res) => {
  const puppeteer = require('puppeteer');
  const { findChromeExecutable } = require('./utils/puppeteerHelper');
  let browser;

  try {
    const executablePath = findChromeExecutable();
    const launchOptions = {
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    };

    if (executablePath) {
      launchOptions.executablePath = executablePath;
    }

    browser = await puppeteer.launch(launchOptions);
    const version = await browser.version();
    await browser.close();

    res.json({
      success: true,
      message: 'Puppeteer launched successfully',
      version,
      executablePath,
      cacheDir: process.env.PUPPETEER_CACHE_DIR,
    });
  } catch (error) {
    const executablePath = findChromeExecutable();
    const debugInfo = {
      cwd: process.cwd(),
      envCacheDir: process.env.PUPPETEER_CACHE_DIR,
      localCacheExists: fs.existsSync(localCache),
      foundExecutablePath: executablePath,
    };

    if (debugInfo.localCacheExists) {
      try {
        debugInfo.cacheContents = fs.readdirSync(localCache, { recursive: true }).slice(0, 100);
      } catch (e) {
        debugInfo.readError = e.message;
      }
    }

    res.status(500).json({
      success: false,
      message: 'Puppeteer failed to launch',
      error: error.message,
      debugInfo,
    });
  }
});

app.get('/health-browser', (req, res) => res.redirect('/api/health-browser'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/readings', require('./routes/readings'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`-------Server running in ${MODE} mode on port ${PORT}-------`);
});
