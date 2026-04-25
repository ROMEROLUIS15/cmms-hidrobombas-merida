import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError as ClassValidatorError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ValidationError } from '../types';

export class ValidationMiddleware {
  static validateBody<T>(targetClass: new () => T) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const dto = plainToClass(targetClass, req.body);
        const errors: ClassValidatorError[] = await validate(dto as object);

        if (errors.length > 0) {
          const validationErrors: ValidationError[] = errors.map((error) => ({
            field: error.property,
            message: Object.values(error.constraints || {}).join(', '),
          }));

          res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: validationErrors,
          });
          return;
        }

        req.body = dto;
        next();
      } catch (error) {
        console.error('Validation middleware error:', error);
        res.status(500).json({
          success: false,
          message: 'Validation failed',
        });
      }
    };
  }

  static validateRegistration(req: Request, res: Response, next: NextFunction): void {
    const { username, email, password, fullName } = req.body;
    const errors: ValidationError[] = [];

    // Username validation
    if (!username || typeof username !== 'string') {
      errors.push({ field: 'username', message: 'Username is required' });
    } else if (username.length < 3 || username.length > 50) {
      errors.push({ field: 'username', message: 'Username must be between 3 and 50 characters' });
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      errors.push({ field: 'username', message: 'Username can only contain letters, numbers, hyphens, and underscores' });
    }

    // Email validation
    if (!email || typeof email !== 'string') {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ field: 'email', message: 'Please provide a valid email address' });
    }

    // Password validation
    if (!password || typeof password !== 'string') {
      errors.push({ field: 'password', message: 'Password is required' });
    } else if (password.length < 8) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
    } else if (password.length > 128) {
      errors.push({ field: 'password', message: 'Password must be less than 128 characters long' });
    }

    // Full name validation
    if (!fullName || typeof fullName !== 'string') {
      errors.push({ field: 'fullName', message: 'Full name is required' });
    } else if (fullName.length < 2 || fullName.length > 100) {
      errors.push({ field: 'fullName', message: 'Full name must be between 2 and 100 characters' });
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    next();
  }

  static validateLogin(req: Request, res: Response, next: NextFunction): void {
    const { email, password } = req.body;
    const errors: ValidationError[] = [];

    if (!email || typeof email !== 'string') {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ field: 'email', message: 'Please provide a valid email address' });
    }

    if (!password || typeof password !== 'string') {
      errors.push({ field: 'password', message: 'Password is required' });
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    next();
  }

  static validateEmail(req: Request, res: Response, next: NextFunction): void {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Email is required',
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
      return;
    }

    next();
  }

  static validateToken(req: Request, res: Response, next: NextFunction): void {
    const token = req.body.token || req.query.token || req.params.token;

    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Token is required',
      });
      return;
    }

    next();
  }

  static validatePasswordReset(req: Request, res: Response, next: NextFunction): void {
    const { token, newPassword } = req.body;
    const errors: ValidationError[] = [];

    if (!token || typeof token !== 'string') {
      errors.push({ field: 'token', message: 'Reset token is required' });
    }

    if (!newPassword || typeof newPassword !== 'string') {
      errors.push({ field: 'newPassword', message: 'New password is required' });
    } else if (newPassword.length < 8) {
      errors.push({ field: 'newPassword', message: 'Password must be at least 8 characters long' });
    } else if (newPassword.length > 128) {
      errors.push({ field: 'newPassword', message: 'Password must be less than 128 characters long' });
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    next();
  }
}