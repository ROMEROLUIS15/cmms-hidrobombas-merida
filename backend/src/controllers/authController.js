const User = require('../models/User');
const { Op } = require('sequelize');
const asyncHandler = require('express-async-handler');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { setAuthCookies, clearAuthCookies } = require('../utils/cookie');
const { revokeToken, isTokenRevoked } = require('../utils/tokenRevocation');

/**
 * Registra un nuevo usuario en el sistema.
 * @async
 * @param {import('express').Request} req - Objeto Request de Express.
 * @param {Object} req.body - Cuerpo de la petición.
 * @param {string} req.body.email - Email del usuario (validado previamente por Zod).
 * @param {string} req.body.password - Contraseña del usuario.
 * @param {string} [req.body.fullName] - Nombre completo del usuario.
 * @param {string} [req.body.full_name] - Nombre completo del usuario (alternativo).
 * @param {string} [req.body.role] - Rol del usuario.
 * @param {import('express').Response} res - Objeto Response de Express.
 * @returns {Promise<void>} Devuelve la respuesta JSON con el token JWT o un error de conflicto.
 */
const register = asyncHandler(async (req, res) => {
    // Accept both camelCase (fullName) and snake_case (full_name) from different clients
    const { fullName, full_name, email, password, role: _role } = req.body;
    const username = fullName || full_name;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email: email.toLowerCase() },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email.toLowerCase()
          ? 'Email already registered'
          : 'Username already taken'
      });
    }

    // Create new user — role is always 'technician' on self-registration.
    // Admins can promote users via PUT /api/users/:id/role.
    const newUser = await User.create({
      username,
      email: email.toLowerCase(),
      password,
      role: 'technician'
    });


    // Generate JWT token
    const token = generateToken(newUser.id, newUser.email, newUser.role);
    const refreshToken = generateRefreshToken(newUser.id);

    setAuthCookies(res, token, refreshToken);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: newUser.toJSON()
    });
});

/**
 * Inicia sesión de un usuario existente.
 * @async
 * @param {import('express').Request} req - Objeto Request de Express.
 * @param {Object} req.body - Cuerpo de la petición.
 * @param {string} req.body.email - Email del usuario.
 * @param {string} req.body.password - Contraseña del usuario.
 * @param {import('express').Response} res - Objeto Response de Express.
 * @returns {Promise<void>} Devuelve la respuesta JSON con el token JWT o un error de autenticación.
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate JWT token
    const token = generateToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);

    setAuthCookies(res, token, refreshToken);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
});

// Get current user profile
const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: user.toJSON()
    });
});

// Logout - revoca el refresh token y limpia cookies
const logout = asyncHandler(async (req, res) => {
  const refreshTokenValue = req.cookies?.refreshToken;
  if (refreshTokenValue) {
    try {
      const decoded = verifyRefreshToken(refreshTokenValue);
      await revokeToken(decoded.jti, decoded.exp);
    } catch {
      // Token inválido/expirado: nada que revocar.
    }
  }

  clearAuthCookies(res);
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Refresh token endpoint
const refreshToken = asyncHandler(async (req, res) => {
  const refreshTokenValue = req.cookies.refreshToken;

  if (!refreshTokenValue) {
    return res.status(401).json({
      success: false,
      message: 'No refresh token provided'
    });
  }

  try {
    const decoded = verifyRefreshToken(refreshTokenValue);

    // Rechaza tokens ya revocados (logout previo o reutilización de uno rotado).
    if (await isTokenRevoked(decoded.jti)) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has been revoked'
      });
    }

    const user = await User.findByPk(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Rotación con revocación: el token usado deja de ser válido.
    await revokeToken(decoded.jti, decoded.exp);

    const newToken = generateToken(user.id, user.email, user.role);
    const newRefreshToken = generateRefreshToken(user.id);

    setAuthCookies(res, newToken, newRefreshToken);

    res.status(200).json({
      success: true,
      token: newToken
    });
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
});

module.exports = {
  register,
  login,
  getProfile,
  logout,
  refreshToken
};