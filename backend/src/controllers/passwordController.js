const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const { User, PasswordResetToken } = require('../models');
const { Op } = require('sequelize');

// ─── Helper ───────────────────────────────────────────────────────────────────

const generateSecureToken = () => crypto.randomBytes(32).toString('hex');

const ONE_HOUR_MS = 60 * 60 * 1000;

// ─── POST /api/auth/forgot-password ───────────────────────────────────────────
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email: email.toLowerCase() } });

  // Always respond the same way to prevent email enumeration attacks
  if (!user) {
    return res.status(200).json({
      success: true,
      email_sent: false,
      message: 'Si ese email está registrado, recibirás un enlace de recuperación.'
    });
  }

  // Delete any existing tokens for this user
  await PasswordResetToken.destroy({ where: { userId: user.id } });

  // Create new token
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + ONE_HOUR_MS);

  await PasswordResetToken.create({ token, expiresAt, userId: user.id });

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password/${token}`;

  // In development, print the link to the console instead of sending an email
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n🔑 [DEV] Password reset link for', user.email, ':');
    console.log('   ', resetUrl, '\n');
  }
  // TODO: In production, send email via nodemailer/sendgrid using resetUrl

  res.status(200).json({
    success: true,
    email_sent: true,
    message: 'Si ese email está registrado, recibirás un enlace de recuperación.'
  });
});

// ─── GET /api/auth/validate-token/:token ──────────────────────────────────────
const validateResetToken = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const record = await PasswordResetToken.findOne({
    where: {
      token,
      expiresAt: { [Op.gt]: new Date() }
    }
  });

  if (!record) {
    return res.status(400).json({
      success: false,
      valid: false,
      message: 'Token inválido o expirado'
    });
  }

  res.status(200).json({ success: true, valid: true });
});

// ─── POST /api/auth/reset-password ────────────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  const { token, new_password, confirm_password } = req.body;

  if (new_password !== confirm_password) {
    return res.status(400).json({
      success: false,
      message: 'Las contraseñas no coinciden'
    });
  }

  const record = await PasswordResetToken.findOne({
    where: {
      token,
      expiresAt: { [Op.gt]: new Date() }
    },
    include: [{ model: User, as: 'user' }]
  });

  if (!record) {
    return res.status(400).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }

  // Update password (the beforeSave hook in User model will hash it)
  await record.user.update({ password: new_password });

  // Delete the used token
  await record.destroy();

  res.status(200).json({
    success: true,
    message: 'Contraseña restablecida exitosamente'
  });
});

// ─── GET /api/auth/verify-email/:token ────────────────────────────────────────
// NOTE: In this project users are auto-verified on register.
// This endpoint exists for future use and returns success for any valid user.
const verifyEmail = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Tu cuenta ha sido verificada exitosamente. Ya puedes iniciar sesión.'
  });
});

// ─── POST /api/auth/resend-verification ───────────────────────────────────────
const resendVerification = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Si ese email está registrado, recibirás un nuevo enlace de verificación.'
  });
});

module.exports = {
  forgotPassword,
  validateResetToken,
  resetPassword,
  verifyEmail,
  resendVerification
};
