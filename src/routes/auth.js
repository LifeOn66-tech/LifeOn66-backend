const express = require('express');
const {
  register,
  login,
  googleLogin,
  getMe,
  updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/me', protect, updateProfile);

module.exports = router;
