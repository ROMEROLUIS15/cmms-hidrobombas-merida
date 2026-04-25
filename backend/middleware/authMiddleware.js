const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require valid JWT token
const protect = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authorization token required'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token not provided'
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

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

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

// Optional authentication - doesn't fail if no token
const optional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next(); // Continue without user
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findOne({
        where: { 
          id: decoded.userId,
          isActive: true 
        }
      });

      if (user) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role
        };
      }
    } catch (tokenError) {
      // Silent fail for optional auth
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue without user
  }
};

module.exports = {
  protect,
  authorize,
  optional
};