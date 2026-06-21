const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

const DEFAULT_SUFFIXES = ['.vercel.app', '.onrender.com'];

function normalizeOrigin(origin) {
  if (!origin || typeof origin !== 'string') return '';
  return origin.trim().replace(/\/+$/, '');
}

function parseList(envValue) {
  if (!envValue || typeof envValue !== 'string') return [];
  return envValue
    .split(',')
    .map((entry) => normalizeOrigin(entry))
    .filter(Boolean);
}

function getAllowedOrigins() {
  const fromEnv = parseList(process.env.ALLOWED_ORIGINS);
  const fromLegacy = parseList(
    [process.env.FRONTEND_URL, process.env.CLIENT_URL].filter(Boolean).join(',')
  );
  const useDefaults = fromEnv.length === 0 && fromLegacy.length === 0;

  return [...new Set([...fromEnv, ...fromLegacy, ...(useDefaults ? DEFAULT_ORIGINS : [])])];
}

function getAllowedOriginSuffixes() {
  const fromEnv = parseList(process.env.ALLOWED_ORIGIN_SUFFIXES);
  return fromEnv.length > 0 ? fromEnv : DEFAULT_SUFFIXES;
}

function isAllowedOrigin(origin) {
  const clean = normalizeOrigin(origin);
  if (!clean) return false;
  if (getAllowedOrigins().includes(clean)) return true;
  return getAllowedOriginSuffixes().some((suffix) => clean.endsWith(suffix));
}

function resolveDefaultFrontendOrigin() {
  const fromEnv = normalizeOrigin(process.env.FRONTEND_URL || process.env.CLIENT_URL);
  if (fromEnv && isAllowedOrigin(fromEnv)) return fromEnv;

  const allowed = getAllowedOrigins();
  return allowed[0] || 'http://localhost:5173';
}

module.exports = {
  getAllowedOrigins,
  getAllowedOriginSuffixes,
  isAllowedOrigin,
  resolveDefaultFrontendOrigin,
  normalizeOrigin,
};
