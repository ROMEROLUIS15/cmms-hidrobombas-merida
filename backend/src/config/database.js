const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_STORAGE || './database.sqlite', // Use memory DB for tests
  logging: false, // Silenced to keep terminal clean. Set to console.log to debug queries.
  define: {
    timestamps: true,
    underscored: false
  }
});

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
    process.exit(1);
  }
};

// Initialize database
const initializeDatabase = async () => {
  try {
    await testConnection();
    // Use sync() without alter:true — SQLite doesn't support ALTER TABLE well.
    // Use `npm run seed:dummy` (force:true) to rebuild the schema from scratch.
    await sequelize.sync();
    console.log('✅ Database synchronized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  initializeDatabase
};