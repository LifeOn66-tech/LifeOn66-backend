const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

const PORT = process.env.PORT || 5000;
const MODE = process.env.NODE_ENV || 'development';

// Validate environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`CRITICAL ERROR: Environment variable ${envVar} is missing!`);
    process.exit(1);
  }
});

// Set global Puppeteer cache directory for Render stability
const path = require('path');
const fs = require('fs');
const localCache = path.join(process.cwd(), 'puppeteer_cache');

// Always set this so Puppeteer knows where to look by default
process.env.PUPPETEER_CACHE_DIR = localCache;
console.log(`[Config] Puppeteer cache path set to: ${localCache}`);

if (process.env.PUPPETEER_EXECUTABLE_PATH) {
  console.log(`[Config] Puppeteer configured to use pre-installed Chrome at: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
} else if (fs.existsSync(localCache)) {
  console.log(`[Config] Verified: Local cache directory exists.`);
} else if (MODE === 'production') {
  console.warn(`[Config] Warning: Local cache directory NOT found at ${localCache} and no pre-installed Chrome path configured. This might cause launch failures.`);
} else {
  console.log(`[Config] Tip: Run 'npm run postinstall' to download Chrome locally.`);
}

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Enable CORS
const allowedOrigins = [
  'https://lifeon66-frontend.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Clean origin (remove trailing slash)
    const cleanOrigin = origin.replace(/\/+$/, '');
    
    // Check if the origin is in the allowed list or if it's a vercel/render deployment
    if (
      allowedOrigins.indexOf(cleanOrigin) !== -1 || 
      cleanOrigin.endsWith('.vercel.app') || 
      cleanOrigin.endsWith('.onrender.com')
    ) {
      return callback(null, true);
    }
    
    return callback(null, true); // Fallback to allow all for now to debug
  },
  credentials: true
}));

// Legacy/Compatibility Redirects - Handles requests without /api prefix
app.use((req, res, next) => {
  const legacyPaths = ['/auth', '/payments', '/readings', '/reports'];
  const segments = req.path.split('/').filter(Boolean);
  const firstPath = segments.length > 0 ? '/' + segments[0] : '';
  
  if (legacyPaths.includes(firstPath) && !req.path.startsWith('/api')) {
    const newUrl = '/api' + req.url;
    console.log(`[Redirect] Routing legacy path ${req.path} -> ${newUrl}`);
    req.url = newUrl;
  }
  next();
});


// Root health check
app.get('/api/health-browser', async (req, res) => {
  const puppeteer = require('puppeteer');
  const { findChromeExecutable } = require('./utils/puppeteerHelper');
  let browser;
  try {
    const executablePath = findChromeExecutable();
    console.log(`[Health] Launching with executablePath: ${executablePath || 'default'}`);
    
    const launchOptions = {
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
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
      cacheDir: process.env.PUPPETEER_CACHE_DIR 
    });
  } catch (error) {
    const localCachePath = path.join(process.cwd(), 'puppeteer_cache');
    const executablePath = findChromeExecutable();
    let debugInfo = { 
      cwd: process.cwd(),
      envCacheDir: process.env.PUPPETEER_CACHE_DIR,
      localCacheExists: fs.existsSync(localCachePath), 
      foundExecutablePath: executablePath
    };
    
    if (debugInfo.localCacheExists) {
      try {
        debugInfo.cacheContents = fs.readdirSync(localCachePath, { recursive: true }).slice(0, 100);
      } catch (e) { debugInfo.readError = e.message; }
    }

    res.status(500).json({ 
      success: false, 
      message: 'Puppeteer failed to launch', 
      error: error.message, 
      debugInfo 
    });
  }
});

// Alias at root for easier access
app.get('/health-browser', (req, res) => res.redirect('/api/health-browser'));


// Mount routers
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
  console.log(`--------------Server running in ${MODE} mode on port ${PORT}------------`);
});
