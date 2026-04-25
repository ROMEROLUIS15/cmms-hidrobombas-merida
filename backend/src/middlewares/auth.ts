import { Request, Response, NextFunction } from 'express';
import { JWTUtils } from '../utils/jwt';
import { AuthService } from '../services/AuthService';
import { AuthRequest } from '../types';

export class AuthMiddleware {
  private static authService = new AuthService();

  static async authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          message: 'Access token required',
        });
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      try {
        const payload = JWTUtils.verifyToken(token);
        const user = await AuthMiddleware.authService.getUserById(payload.userId);

        if (!user) {
          res.status(401).json({
            success: false,
            message: 'User not found',
          });
          return;
        }

        if (!user.isActive) {
          res.status(401).json({
            success: false,
            message: 'Account deactivated',
          });
          return;
        }

        if (!user.isEmailVerified) {
          res.status(401).json({
            success: false,
            message: 'Email not verified',
          });
          return;
        }

        req.user = user;
        next();
      } catch (tokenError) {
        res.status(401).json({
          success: false,
          message: 'Invalid or expired token',
        });
        return;
      }
    } catch (error) {
      console.error('Authentication middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication failed',
      });
    }
  }

  static authorize(roles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (!roles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
        });
        return;
      }

      next();
    };
  }

  static optional(req: AuthRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    AuthMiddleware.authenticate(req, res, next);
  }
}

// Export convenience functions
export const authenticateToken = AuthMiddleware.authenticate;
export const authorize = AuthMiddleware.authorize;
export const optionalAuth = AuthMiddleware.optional;