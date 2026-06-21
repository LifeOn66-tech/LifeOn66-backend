const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const {
  isAllowedOrigin,
  normalizeOrigin,
  resolveDefaultFrontendOrigin,
} = require('../config/allowedOrigins');

const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const GOOGLE_CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || '').trim();

let oauthClient = null;

function isAllowedFrontendOrigin(origin) {
  return isAllowedOrigin(origin);
}

function resolveFrontendOrigin(req) {
  const fromQuery = req?.query?.frontend_url || req?.query?.frontend_origin;
  if (fromQuery && isAllowedFrontendOrigin(fromQuery)) {
    return normalizeOrigin(fromQuery);
  }
  return resolveDefaultFrontendOrigin();
}

function resolveRedirectUri(req) {
  const fromEnv = (process.env.GOOGLE_REDIRECT_URI || '').trim();
  if (fromEnv) return fromEnv;
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${proto}://${host}/api/auth/google/callback`;
}

function getOAuthClient(redirectUri) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth is not configured on the server');
  }
  return new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri);
}

function isGoogleOAuthConfigured() {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}

function buildGoogleAuthUrl(req, state) {
  const redirectUri = resolveRedirectUri(req);
  const client = getOAuthClient(redirectUri);
  return client.generateAuthUrl({
    access_type: 'online',
    scope: ['openid', 'email', 'profile'],
    state,
    prompt: 'select_account',
    redirect_uri: redirectUri,
  });
}

function createGoogleOAuthState(frontendOrigin) {
  return jwt.sign(
    { purpose: 'google_oauth', frontendOrigin, ts: Date.now() },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );
}

function verifyGoogleOAuthState(state) {
  const payload = jwt.verify(state, process.env.JWT_SECRET);
  if (payload.purpose !== 'google_oauth') {
    throw new Error('Invalid OAuth state');
  }
  if (!isAllowedFrontendOrigin(payload.frontendOrigin)) {
    throw new Error('Invalid OAuth frontend origin');
  }
  return payload;
}

async function exchangeGoogleCode(req, code) {
  const redirectUri = resolveRedirectUri(req);
  const client = getOAuthClient(redirectUri);
  const { tokens } = await client.getToken({ code, redirect_uri: redirectUri });
  if (!tokens.id_token) {
    throw new Error('Google did not return an ID token');
  }
  return verifyGoogleIdToken(tokens.id_token);
}

function getOAuthClientForIdToken() {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID is not configured on the server');
  }
  if (!oauthClient) {
    oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);
  }
  return oauthClient;
}

/**
 * Verifies a Google ID token from the frontend GIS "credential" field.
 */
async function verifyGoogleIdToken(idToken) {
  const client = getOAuthClientForIdToken();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw new Error('Google account email is missing');
  }
  if (payload.email_verified === false) {
    throw new Error('Google account email is not verified');
  }
  return payload;
}

async function upsertGoogleUser(User, payload) {
  const email = payload.email.toLowerCase().trim();
  const googleId = payload.sub;
  const fullName = payload.name || payload.given_name || email.split('@')[0];
  const avatar = payload.picture || '';

  let user = await User.findOne({ googleId });

  if (!user) {
    user = await User.findOne({ email });

    if (user) {
      user.googleId = googleId;
      if (!user.fullName && fullName) user.fullName = fullName;
      if (!user.avatar && avatar) user.avatar = avatar;
      if (user.authProvider === 'local' && !user.password) {
        user.authProvider = 'google';
      }
      await user.save();
    } else {
      user = await User.create({
        email,
        googleId,
        fullName,
        avatar,
        authProvider: 'google',
        password: User.generateRandomPassword(),
      });
    }
  } else {
    if (!user.fullName && fullName) user.fullName = fullName;
    if (avatar) user.avatar = avatar;
    await user.save();
  }

  return user;
}

module.exports = {
  GOOGLE_CLIENT_ID,
  isGoogleOAuthConfigured,
  isAllowedFrontendOrigin,
  resolveFrontendOrigin,
  buildGoogleAuthUrl,
  createGoogleOAuthState,
  verifyGoogleOAuthState,
  exchangeGoogleCode,
  verifyGoogleIdToken,
  upsertGoogleUser,
};
