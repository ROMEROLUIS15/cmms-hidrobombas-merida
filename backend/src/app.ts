import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env';
import { initializeDatabase } from './config/database';
import routes from './routes';

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: [
        config.app.frontendUrl,
        'http://localhost:3000',
        'https://cmms-hydro-1.preview.emergentagent.com'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging middleware
    if (config.app.nodeEnv === 'development') {
      this.app.use(morgan('combined'));
    }

    // Request logging for debugging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use('/api', routes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'CMMS Hidrobombas API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use((req, res, next) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.originalUrl,
      });
    });

    // Global error handler
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Global error handler:', error);
      
      res.status(500).json({
        success: false,
        message: config.app.nodeEnv === 'development' ? error.message : 'Internal server error',
        ...(config.app.nodeEnv === 'development' && { stack: error.stack }),
      });
    });
  }

  public async initialize(): Promise<void> {
    try {
      // Initialize database connection
      await initializeDatabase();
      console.log('✅ App initialized successfully');
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      process.exit(1);
    }
  }

  public listen(): void {
    this.app.listen(config.app.port, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${config.app.port}`);
      console.log(`📱 Environment: ${config.app.nodeEnv}`);
      console.log(`🔗 API URL: http://localhost:${config.app.port}/api`);
      console.log(`🔗 Health Check: http://localhost:${config.app.port}/api/health`);
    });
  }
}

export default App;