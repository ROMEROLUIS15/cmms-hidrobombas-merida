const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { errorHandler } = require('./middleware/errorHandler');
const { idempotencyMiddleware } = require('./middleware/idempotencyMiddleware');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const serviceReportRoutes = require('./routes/serviceReportRoutes');
const clientRoutes = require('./routes/clientRoutes');
const userRoutes = require('./routes/userRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const aiRoutes = require('./routes/aiRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',')
  : ['http://localhost:5000'];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (como aplicaciones móviles o herramientas de testing)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Idempotency-Key'],
}));

// Body parsing middleware
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Idempotency middleware
app.use(idempotencyMiddleware);

// Logging middleware (dev mode: concise colored output)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Hidrobombas Mérida API - Monorepo Version',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── Rate Limiting ──────────────────────────────────────────────────────
// skip() desactiva el límite en tests para que los integration tests no sean bloqueados
const isTestEnv = () => process.env.NODE_ENV === 'test';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 15, // máximo 15 intentos por ventana
  skip: isTestEnv,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.'
  }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: isTestEnv,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas peticiones. Intenta de nuevo más tarde.'
  }
});

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/dashboard', apiLimiter, dashboardRoutes);
app.use('/api/equipment', apiLimiter, equipmentRoutes);
app.use('/api/service-reports', apiLimiter, serviceReportRoutes);
app.use('/api/clients', apiLimiter, clientRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/assignments', apiLimiter, assignmentRoutes);
app.use('/api/ai', apiLimiter, aiRoutes);

// Health check routes (public, no auth required)
app.use('/api/health', healthRoutes);
app.use('/health', healthRoutes);

// 404 handler for unknown routes
app.use((req, res, _next) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
