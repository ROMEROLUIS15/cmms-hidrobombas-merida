const { Sequelize } = require('sequelize');
require('dotenv').config();

// Forzar la carga de pg para entornos serverless como Vercel
try {
  require('pg');
} catch (e) {
  // Ignorar si falla localmente si no se usa Postgres
}

const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;
const databaseUrl = process.env.DATABASE_URL;

// En Vercel, FORZAMOS el uso de Postgres. Si no hay URL, lanzamos error.
if (isVercel && !databaseUrl) {
  throw new Error('❌ CRITICAL ERROR: DATABASE_URL is missing in Vercel environment. Please check your Environment Variables in Vercel dashboard.');
}

const isPostgres = !!databaseUrl;
console.log('🌐 Database Mode:', isPostgres ? 'POSTGRES' : 'SQLITE');

const sequelize = isPostgres
  ? new Sequelize(databaseUrl, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: false,
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: process.env.DB_STORAGE || './database.sqlite',
      logging: false,
    });

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
    if (!process.env.VERCEL) process.exit(1);
    throw error;
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
    if (!process.env.VERCEL) process.exit(1);
    throw error;
  }
};

module.exports = {
  sequelize,
  initializeDatabase
};