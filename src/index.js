const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Validate environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`CRITICAL ERROR: Environment variable ${envVar} is missing!`);
    process.exit(1);
  }
});

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
    
    // Check if the origin is in the allowed list or if it's a vercel deployment
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true
}));

// Legacy/Compatibility Redirects - Handles requests without /api prefix
app.use((req, res, next) => {
  const legacyPaths = ['/auth', '/payments', '/readings', '/reports'];
  const firstPath = '/' + req.path.split('/')[1];
  
  if (legacyPaths.includes(firstPath) && !req.path.startsWith('/api')) {
    const newUrl = '/api' + req.url;
    console.log(`[Redirect] Routing legacy path ${req.path} -> ${newUrl}`);
    req.url = newUrl;
  }
  next();
});

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`--------------Server running in ${process.env.NODE_ENV} mode on port ${PORT}------------`);
});
