import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthMiddleware } from '../middlewares/auth';
import { ValidationMiddleware } from '../middlewares/validation';

const router = Router();
const authController = new AuthController();

// Public routes
router.post(
  '/register',
  ValidationMiddleware.validateRegistration,
  authController.register
);

router.post(
  '/login',
  ValidationMiddleware.validateLogin,
  authController.login
);

router.post(
  '/verify-email',
  ValidationMiddleware.validateToken,
  authController.verifyEmail
);

router.get(
  '/verify-email/:token',
  ValidationMiddleware.validateToken,
  authController.verifyEmail
);

router.post(
  '/forgot-password',
  ValidationMiddleware.validateEmail,
  authController.forgotPassword
);

router.post(
  '/reset-password',
  ValidationMiddleware.validatePasswordReset,
  authController.resetPassword
);

router.post(
  '/refresh-token',
  authController.refreshToken
);

// Protected routes
router.get(
  '/check',
  AuthMiddleware.authenticate,
  authController.check
);

router.get(
  '/me',
  AuthMiddleware.authenticate,
  authController.me
);

router.post(
  '/logout',
  AuthMiddleware.authenticate,
  authController.logout
);

export default router;