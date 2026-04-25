import { Request } from 'express';
import { User } from '../entities/User';

export interface AuthRequest extends Request {
  user?: User;
}

export interface RegisterDTO {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  token: string;
  newPassword: string;
}

export interface VerifyEmailDTO {
  token: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: Partial<User>;
  token?: string;
  refreshToken?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface ValidationError {
  field: string;
  message: string;
}