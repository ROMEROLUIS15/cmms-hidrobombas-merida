const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// Helper to extract token from header or cookie
const extractToken = (req) => {
  // First try Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Fall back to cookie
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
};

// Protect routes - require valid JWT token
const protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authorization token required'
    });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists and is active
    const user = await User.findOne({
      where: { 
        id: decoded.userId,
        isActive: true 
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found or deactivated'
      });
    }

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (tokenError) {
    // Handle specific JWT errors
    let message = 'Invalid token';
    
    if (tokenError.name === 'TokenExpiredError') {
      message = 'Token expired';
    } else if (tokenError.name === 'JsonWebTokenError') {
      message = 'Invalid token format';
    } else if (tokenError.name === 'NotBeforeError') {
      message = 'Token not active yet';
    }

    return res.status(401).json({
      success: false,
      message
    });
  }
});

// Authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * authorizeSelfOrAdmin — permite el acceso si el usuario es admin/supervisor
 * o si el parámetro de ruta indicado corresponde a su propio id.
 * Evita que un técnico consulte recursos asociados a OTRO técnico.
 * @param {string} paramName - nombre del param de ruta con el id de técnico/usuario
 */
const authorizeSelfOrAdmin = (paramName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (['admin', 'supervisor'].includes(req.user.role)) {
      return next();
    }

    const ownId = req.user.id || req.user.userId;
    if (ownId && req.params[paramName] === ownId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources'
    });
  };
};

/**
 * optional — autenticación opcional.
 * Si hay token válido (header o cookie), adjunta req.user; si no, continúa.
 * Útil para rutas que sirven contenido público pero enriquecido para usuarios autenticados.
 * Uso: router.get('/public-route', optional, handler)
 */
const optional = asyncHandler(async (req, res, next) => {
  // Check Authorization header first, then cookie (same order as protect)
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies?.token) {
    // Las cookies se emiten con el nombre `token` (ver utils/cookie.js).
    token = req.cookies.token;
  }

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      where: {
        id: decoded.userId,
        isActive: true
      }
    });

    if (user) {
      // Misma forma que `protect`: incluir `id` además de `userId`.
      req.user = {
        id: decoded.userId,
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
    }
  } catch {
    // Silent fail for optional auth
  }

  next();
});

module.exports = {
  protect,
  authorize,
  authorizeSelfOrAdmin,
  optional
};