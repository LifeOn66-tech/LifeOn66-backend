const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { verifyGoogleIdToken } = require('../utils/googleAuth');

function formatUserResponse(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    fullName: user.fullName || '',
    gender: user.gender || '',
    dateOfBirth: user.dateOfBirth || '',
    timeOfBirth: user.timeOfBirth || '',
    placeOfBirth: user.placeOfBirth || '',
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

// @desc    Google OAuth login / sign-up
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

    const { fullName, gender, dateOfBirth, timeOfBirth, placeOfBirth } = req.body;

    if (fullName != null) user.fullName = String(fullName).trim();
    if (gender != null) user.gender = String(gender).trim();
    if (dateOfBirth != null) user.dateOfBirth = String(dateOfBirth).trim();
    if (timeOfBirth != null) user.timeOfBirth = String(timeOfBirth).trim();
    if (placeOfBirth != null) user.placeOfBirth = String(placeOfBirth).trim();

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
