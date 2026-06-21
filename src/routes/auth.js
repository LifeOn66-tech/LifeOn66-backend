const express = require('express');
const {
  register,
  login,
  googleLogin,
  googleOAuthStart,
  googleOAuthCallback,
  getAuthConfig,
  getMe,
  updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/config', getAuthConfig);
router.get('/google/start', googleOAuthStart);
router.get('/google/callback', googleOAuthCallback);
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/me', protect, updateProfile);

module.exports = router;
