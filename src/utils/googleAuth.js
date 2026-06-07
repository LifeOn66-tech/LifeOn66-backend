const { OAuth2Client } = require('google-auth-library');

const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();

let oauthClient = null;

function getOAuthClient() {
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
  const client = getOAuthClient();
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

module.exports = { verifyGoogleIdToken, GOOGLE_CLIENT_ID };
