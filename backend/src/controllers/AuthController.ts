import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthRequest } from '../types';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.register(req.body);
      
      const statusCode = result.success ? 201 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error('Register controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.login(req.body);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error('Login controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.body.token || req.query.token || req.params.token;
      const result = await this.authService.verifyEmail({ token });
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error('Verify email controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.forgotPassword(req.body);
      
      // Always return 200 for security reasons (don't reveal if email exists)
      res.status(200).json(result);
    } catch (error) {
      console.error('Forgot password controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.resetPassword(req.body);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error('Reset password controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
        return;
      }

      const result = await this.authService.refreshToken(refreshToken);
      
      const statusCode = result.success ? 200 : 401;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error('Refresh token controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  check = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // If we reach here, the auth middleware has already validated the token
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Authentication valid',
        user: req.user.toJSON(),
      });
    } catch (error) {
      console.error('Check controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  me = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      res.status(200).json({
        success: true,
        user: req.user.toJSON(),
      });
    } catch (error) {
      console.error('Me controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  logout = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // For JWT, logout is handled client-side by removing the token
      // In a more sophisticated system, you might maintain a blacklist of tokens
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('Logout controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
}