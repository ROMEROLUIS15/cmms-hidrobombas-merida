const express = require('express');
const { register, login, getProfile, logout, refreshToken, bootstrapStatus } = require('../controllers/authController');
const {
  forgotPassword,
  validateResetToken,
  resetPassword,
  verifyEmail,
  resendVerification
} = require('../controllers/passwordController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/zodMiddleware');
const { registerSchema, loginSchema } = require('../validators/authValidators');

const router = express.Router();

// ── Public Auth ──────────────────────────────────────────────────────────────
// Estado de inicialización: el frontend lo consulta para explicar por qué el
// registro está cerrado mientras no exista un administrador.
router.get('/bootstrap-status', bootstrapStatus);
router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);

// ── Password Recovery ────────────────────────────────────────────────────────
router.post('/forgot-password', forgotPassword);
router.get('/validate-token/:token', validateResetToken);
router.post('/reset-password', resetPassword);

// ── Email Verification ───────────────────────────────────────────────────────
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);

// ── Protected ────────────────────────────────────────────────────────────────
router.get('/profile', protect, getProfile);
router.post('/logout', protect, logout);
router.post('/refresh-token', refreshToken);

// ── Health Check ─────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;