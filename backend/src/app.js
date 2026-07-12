const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { errorHandler } = require('./middleware/errorHandler');
const { idempotencyMiddleware } = require('./middleware/idempotencyMiddleware');
const { correlationId, CORRELATION_HEADER } = require('./middleware/correlationId');
const { createRateLimitStore } = require('./config/rateLimitStore');
const { resolveTrustProxy } = require('./utils/trustProxy');
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

// Confianza en el proxy: en Vercel la IP real del cliente solo llega vía
// X-Forwarded-For. Sin esto, express-rate-limit lanza
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR y limita a todo el mundo por la IP del
// proxy (es decir, no limita). Ver utils/trustProxy.js para por qué fuera de
// Vercel NO se confía en la cabecera.
app.set('trust proxy', resolveTrustProxy());

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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Idempotency-Key', 'X-Correlation-Id'],
}));

// Correlation ID (antes del logging para poder incluirlo en cada request)
app.use(correlationId);

// Body parsing middleware
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Idempotency middleware
app.use(idempotencyMiddleware);

// Logging middleware (dev mode: concise colored output + correlation id)
if (process.env.NODE_ENV !== 'test') {
  morgan.token('correlation-id', (req) => req.correlationId || '-');
  app.use(morgan(':method :url :status :response-time ms - :correlation-id'));
}

// Exponer el header de correlación a clientes con CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Expose-Headers', CORRELATION_HEADER);
  next();
});

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

// Store compartido (Redis) si REDIS_URL está configurada; si no, cada limiter
// cae al MemoryStore por defecto. Cada uno usa su propio prefijo para no
// colisionar las claves en Redis. Ver config/rateLimitStore.js para el porqué
// (en serverless el MemoryStore es por-instancia y debilita el límite real).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 15, // máximo 15 intentos por ventana
  skip: isTestEnv,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('rl:auth:'),
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
  store: createRateLimitStore('rl:api:'),
  message: {
    success: false,
    message: 'Demasiadas peticiones. Intenta de nuevo más tarde.'
  }
});

// Limiter más estricto para endpoints de IA: cada llamada consume tokens/costo
// del LLM, por lo que se acota más que el resto de la API.
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AI_RATE_LIMIT_MAX) || 30,
  skip: isTestEnv,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('rl:ai:'),
  message: {
    success: false,
    message: 'Demasiadas peticiones a los servicios de IA. Intenta de nuevo más tarde.'
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
app.use('/api/ai', aiLimiter, aiRoutes);

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
