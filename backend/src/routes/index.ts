import { Router } from 'express';
import authRoutes from './auth';
import clientRoutes from './clients';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: 'postgresql',
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);

export default router;