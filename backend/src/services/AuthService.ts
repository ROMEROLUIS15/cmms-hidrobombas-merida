import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import { EmailService } from './EmailService';
import { JWTUtils } from '../utils/jwt';
import { PasswordUtils } from '../utils/password';
import {
  RegisterDTO,
  LoginDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  VerifyEmailDTO,
  AuthResponse,
  JWTPayload,
} from '../types';

export class AuthService {
  private userRepository: Repository<User>;
  private emailService: EmailService;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.emailService = new EmailService();
  }

  async register(registerData: RegisterDTO): Promise<AuthResponse> {
    try {
      // Validate password strength
      const passwordValidation = PasswordUtils.validatePassword(registerData.password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: passwordValidation.errors.join(', '),
        };
      }

      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: [
          { email: registerData.email },
          { username: registerData.username },
        ],
      });

      if (existingUser) {
        return {
          success: false,
          message: existingUser.email === registerData.email 
            ? 'Email already registered' 
            : 'Username already taken',
        };
      }

      // Create new user
      const user = this.userRepository.create({
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
        fullName: registerData.fullName,
        role: UserRole.TECHNICIAN,
      });

      // Generate verification token
      const verificationToken = user.generateEmailVerificationToken();
      
      // Save user
      await this.userRepository.save(user);

      // Send verification email
      await this.emailService.sendVerificationEmail(
        user.email,
        verificationToken,
        user.username
      );

      return {
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        user: user.toJSON(),
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed. Please try again.',
      };
    }
  }

  async login(loginData: LoginDTO): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await this.userRepository.findOne({
        where: { email: loginData.email },
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        return {
          success: false,
          message: 'Account is temporarily locked due to too many failed login attempts',
        };
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(loginData.password);
      
      if (!isPasswordValid) {
        // Increment failed login attempts
        user.failedLoginAttempts += 1;
        
        // Lock account after 5 failed attempts
        if (user.failedLoginAttempts >= 5) {
          user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        }
        
        await this.userRepository.save(user);
        
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        return {
          success: false,
          message: 'Please verify your email before logging in',
        };
      }

      // Check if account is active
      if (!user.isActive) {
        return {
          success: false,
          message: 'Account is deactivated. Contact administrator.',
        };
      }

      // Reset failed login attempts and update last login
      user.failedLoginAttempts = 0;
      user.lockedUntil = undefined;
      user.lastLogin = new Date();
      await this.userRepository.save(user);

      // Generate JWT tokens
      const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = JWTUtils.generateAccessToken(payload);
      const refreshToken = JWTUtils.generateRefreshToken(payload);

      return {
        success: true,
        message: 'Login successful',
        user: user.toJSON(),
        token: accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.',
      };
    }
  }

  async verifyEmail(verifyData: VerifyEmailDTO): Promise<AuthResponse> {
    try {
      const user = await this.userRepository.findOne({
        where: {
          emailVerificationToken: verifyData.token,
        },
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid verification token',
        };
      }

      // Check if token is expired
      if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
        return {
          success: false,
          message: 'Verification token has expired',
        };
      }

      // Verify email
      user.isEmailVerified = true;
      user.clearVerificationToken();
      await this.userRepository.save(user);

      // Send welcome email
      await this.emailService.sendWelcomeEmail(user.email, user.username);

      return {
        success: true,
        message: 'Email verified successfully',
        user: user.toJSON(),
      };
    } catch (error) {
      console.error('Email verification error:', error);
      return {
        success: false,
        message: 'Email verification failed',
      };
    }
  }

  async forgotPassword(forgotData: ForgotPasswordDTO): Promise<AuthResponse> {
    try {
      const user = await this.userRepository.findOne({
        where: { email: forgotData.email },
      });

      if (!user) {
        // Don't reveal if email exists or not
        return {
          success: true,
          message: 'If the email exists, a password reset link has been sent',
        };
      }

      // Generate reset token
      const resetToken = user.generatePasswordResetToken();
      await this.userRepository.save(user);

      // Send reset email
      await this.emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.username
      );

      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        message: 'Failed to process password reset request',
      };
    }
  }

  async resetPassword(resetData: ResetPasswordDTO): Promise<AuthResponse> {
    try {
      const user = await this.userRepository.findOne({
        where: {
          passwordResetToken: resetData.token,
        },
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid reset token',
        };
      }

      // Check if token is expired
      if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        return {
          success: false,
          message: 'Reset token has expired',
        };
      }

      // Validate new password
      const passwordValidation = PasswordUtils.validatePassword(resetData.newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: passwordValidation.errors.join(', '),
        };
      }

      // Update password
      user.password = resetData.newPassword; // Will be hashed by @BeforeUpdate
      user.clearPasswordResetToken();
      user.failedLoginAttempts = 0;
      user.lockedUntil = undefined;
      
      await this.userRepository.save(user);

      return {
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: 'Failed to reset password',
      };
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({
        where: { id: userId },
      });
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  async refreshToken(token: string): Promise<AuthResponse> {
    try {
      const payload = JWTUtils.verifyToken(token);
      const user = await this.getUserById(payload.userId);

      if (!user || !user.isActive || !user.isEmailVerified) {
        return {
          success: false,
          message: 'Invalid refresh token',
        };
      }

      const newPayload: JWTPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = JWTUtils.generateAccessToken(newPayload);
      const refreshToken = JWTUtils.generateRefreshToken(newPayload);

      return {
        success: true,
        message: 'Token refreshed successfully',
        token: accessToken,
        refreshToken,
        user: user.toJSON(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Invalid refresh token',
      };
    }
  }
}