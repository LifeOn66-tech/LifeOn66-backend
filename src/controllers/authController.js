const User = require('../models/User');
const jwt = require('jsonwebtoken');
const {
  verifyGoogleIdToken,
  upsertGoogleUser,
  isGoogleOAuthConfigured,
  resolveFrontendOrigin,
  buildGoogleAuthUrl,
  createGoogleOAuthState,
  verifyGoogleOAuthState,
  exchangeGoogleCode,
} = require('../utils/googleAuth');

function formatUserResponse(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    fullName: user.fullName || '',
    gender: user.gender || '',
    dateOfBirth: user.dateOfBirth || '',
    timeOfBirth: user.timeOfBirth || '',
    placeOfBirth: user.placeOfBirth || '',
    birthLatitude: user.birthLatitude ?? null,
    birthLongitude: user.birthLongitude ?? null,
    birthTimezone: user.birthTimezone || '',
    birthCountryCode: user.birthCountryCode || '',
    subscriptionTier: user.subscriptionTier || 'free',
    creditsRemaining: user.creditsRemaining ?? 10,
    avatar: user.avatar || '',
    authProvider: user.authProvider || 'local',
  };
}

function sendTokenResponse(user, statusCode, res) {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  res.status(statusCode).json({
    success: true,
    token,
    user: formatUserResponse(user),
  });
}

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    const user = await User.create({
      email,
      password,
      fullName,
      authProvider: 'local',
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    let message = err.message;
    if (err.code === 11000) {
      message = 'An account with this email already exists. Please sign in instead.';
    }
    res.status(400).json({
      success: false,
      error: message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide an email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (!user.password) {
      return res.status(401).json({
        success: false,
        error: 'This account uses Google sign-in. Please continue with Google.',
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

// @desc    Start Google OAuth redirect (avoids frontend origin restrictions)
// @route   GET /api/auth/google/start
// @access  Public
exports.googleOAuthStart = (req, res) => {
  try {
    if (!isGoogleOAuthConfigured()) {
      const frontendOrigin = resolveFrontendOrigin(req);
      return res.redirect(`${frontendOrigin}/login?error=google_not_configured`);
    }

    const frontendOrigin = resolveFrontendOrigin(req);
    const state = createGoogleOAuthState(frontendOrigin);
    res.redirect(buildGoogleAuthUrl(req, state));
  } catch (err) {
    console.error('[Auth] Google OAuth start error:', err.message);
    const frontendOrigin = resolveFrontendOrigin(req);
    res.redirect(`${frontendOrigin}/login?error=google_failed`);
  }
};

// @desc    Google OAuth callback — issues JWT and redirects to frontend
// @route   GET /api/auth/google/callback
// @access  Public
exports.googleOAuthCallback = async (req, res) => {
  let frontendOrigin = resolveFrontendOrigin(req);

  try {
    const { code, state, error } = req.query;

    if (state) {
      const decoded = verifyGoogleOAuthState(state);
      frontendOrigin = decoded.frontendOrigin;
    }

    if (error) {
      return res.redirect(`${frontendOrigin}/login?error=google_denied`);
    }

    if (!code) {
      return res.redirect(`${frontendOrigin}/login?error=google_no_code`);
    }

    const payload = await exchangeGoogleCode(req, code);
    const user = await upsertGoogleUser(User, payload);
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    const redirectUrl = new URL('/auth/google/callback', `${frontendOrigin}/`);
    redirectUrl.searchParams.set('token', token);
    return res.redirect(redirectUrl.toString());
  } catch (err) {
    console.error('[Auth] Google OAuth callback error:', err.message);
    return res.redirect(`${frontendOrigin}/login?error=google_failed`);
  }
};

// @desc    Google OAuth login / sign-up (GIS credential token)
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res) => {
  try {
    const idToken = req.body.credential || req.body.idToken || req.body.token;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'Google credential token is required',
      });
    }

    const payload = await verifyGoogleIdToken(idToken);
    const user = await upsertGoogleUser(User, payload);
    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('[Auth] Google login error:', err.message);
    res.status(401).json({
      success: false,
      error: err.message?.includes('not configured')
        ? 'Google sign-in is not configured on the server'
        : 'Google sign-in failed. Please try again.',
    });
  }
};

// @desc    Public auth config for the frontend
// @route   GET /api/auth/config
// @access  Public
exports.getAuthConfig = (req, res) => {
  const apiBase = `${req.protocol}://${req.get('host')}`;
  const razorpayKeyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  res.status(200).json({
    success: true,
    googleOAuthEnabled: isGoogleOAuthConfigured(),
    googleOAuthStartUrl: `${apiBase}/api/auth/google/start?frontend_url=${encodeURIComponent(resolveFrontendOrigin(req))}`,
    razorpayKeyId: razorpayKeyId || null,
    keyId: razorpayKeyId || null,
    key: razorpayKeyId || null,
    paymentsConfigUrl: `${apiBase}/api/payments/config`,
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: formatUserResponse(user),
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const {
      fullName,
      gender,
      dateOfBirth,
      timeOfBirth,
      placeOfBirth,
      birthLatitude,
      birthLongitude,
      birthTimezone,
      birthCountryCode,
      countryCode,
      latitude,
      longitude,
      timezoneId,
      timezone,
    } = req.body;

    if (fullName != null) user.fullName = String(fullName).trim();
    if (gender != null) user.gender = String(gender).trim();
    if (dateOfBirth != null) user.dateOfBirth = String(dateOfBirth).trim();
    if (timeOfBirth != null) user.timeOfBirth = String(timeOfBirth).trim();
    if (placeOfBirth != null) user.placeOfBirth = String(placeOfBirth).trim();

    const lat = birthLatitude ?? latitude;
    const lon = birthLongitude ?? longitude;
    const tz = birthTimezone ?? timezoneId ?? timezone;
    const country = birthCountryCode ?? countryCode;
    if (lat != null && lat !== '') user.birthLatitude = Number(lat);
    if (lon != null && lon !== '') user.birthLongitude = Number(lon);
    if (tz != null && tz !== '') user.birthTimezone = String(tz).trim();
    if (country != null && country !== '') {
      const code = String(country).trim().toUpperCase();
      if (/^[A-Z]{2}$/.test(code)) user.birthCountryCode = code;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: formatUserResponse(user),
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};
