const app = require('./app');
require('./models'); // Import models to ensure they are registered with Sequelize before sync
const { initializeDatabase } = require('./config/database');

const PORT = process.env.PORT || 8001;

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    
    if (process.env.VERCEL) {
      // On Vercel, we just need to ensure DB is initialized
      await initializeDatabase();
    } else {
      app.listen(PORT, '0.0.0.0', () => {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`🚀 Server ready [${process.env.NODE_ENV || 'development'}]`);
        }
      });
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    if (!process.env.VERCEL) process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  if (!process.env.VERCEL) process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
  if (!process.env.VERCEL) process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();

module.exports = app;
