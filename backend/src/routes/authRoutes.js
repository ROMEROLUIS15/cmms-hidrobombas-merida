const express = require('express');
const { register, login, getProfile } = require('../controllers/authController');
const {
  forgotPassword,
  validateResetToken,
  resetPassword,
  verifyEmail,
  resendVerification
} = require('../controllers/passwordController');
const { protect } = require('../middleware/authMiddleware');
const { authValidationRules } = require('../middleware/validatorMiddleware');

const router = express.Router();

// ── Public Auth ──────────────────────────────────────────────────────────────
router.post('/register', authValidationRules.register, register);
router.post('/login', authValidationRules.login, login);

// ── Password Recovery ────────────────────────────────────────────────────────
router.post('/forgot-password', forgotPassword);
router.get('/validate-token/:token', validateResetToken);
router.post('/reset-password', resetPassword);

// ── Email Verification ───────────────────────────────────────────────────────
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);

// ── Protected ────────────────────────────────────────────────────────────────
router.get('/profile', protect, getProfile);

// ── Health Check ─────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;