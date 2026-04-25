import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'cmms_user',
    password: process.env.DB_PASSWORD || 'cmms_pass',
    database: process.env.DB_NAME || 'cmms_db',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Email
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@hidrobombas.com',
  },

  // App
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '8001'),
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    tokenExpiryHours: parseInt(process.env.TOKEN_EXPIRY_HOURS || '24'),
    resetTokenExpiryHours: parseInt(process.env.RESET_TOKEN_EXPIRY_HOURS || '1'),
    verifyTokenExpiryHours: parseInt(process.env.VERIFY_TOKEN_EXPIRY_HOURS || '24'),
  },
};

export default config;