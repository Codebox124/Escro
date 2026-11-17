const express = require('express');
const router = express.Router();
const { register, login, getMe, updatePassword } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const { getPlatformSettings } = require('../utils/platform');
const signupGuard = async (req, res, next) => {
  try {
    const { settings } = await getPlatformSettings();
    if (settings.signupsPaused) {
      return res.status(403).json({ status: 'error', message: 'New sign-ups are temporarily paused. Please try again later.' });
    }
  } catch { /* don't block on settings errors */ }
  next();
};
router.post('/register', signupGuard, register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/password', protect, updatePassword);

module.exports = router;
