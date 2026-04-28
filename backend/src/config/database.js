const { Sequelize } = require('sequelize');
require('dotenv').config();

// Forzar la carga de pg para entornos serverless como Vercel
try {
  require('pg');
} catch (e) {
  // Ignorar si falla localmente si no se usa Postgres
}

const isPostgres = !!process.env.DATABASE_URL;

const sequelize = isPostgres
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      protocol: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false // Necesario para Neon/Vercel en muchos casos
        }
      },
      logging: false,
      define: {
        timestamps: true,
        underscored: false
      }
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: process.env.DB_STORAGE || './database.sqlite',
      logging: false,
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