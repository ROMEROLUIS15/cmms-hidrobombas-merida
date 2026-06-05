const { Sequelize } = require('sequelize');
require('dotenv').config();

// Forzar la carga de pg para entornos serverless como Vercel
try {
  require('pg');
} catch {
  // Ignorar si falla localmente si no se usa Postgres
}

const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;
const databaseUrl = process.env.DATABASE_URL;

// En Vercel, FORZAMOS el uso de Postgres. Si no hay URL, lanzamos error.
if (isVercel && !databaseUrl) {
  throw new Error('❌ CRITICAL ERROR: DATABASE_URL is missing in Vercel environment. Please check your Environment Variables in Vercel dashboard.');
}

const isPostgres = !!databaseUrl;

let sequelize;

if (isPostgres) {
  const url = new URL(databaseUrl);

  sequelize = new Sequelize({
    database: url.pathname.replace(/^\//, ''),
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    host: url.hostname,
    port: Number(url.port) || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false,
      },
      family: 4,
      keepAlive: true,
    },
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000,
    },
  });
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './database.sqlite',
    logging: false,
  });
}

// Fallback a SQLite si la conexión PostgreSQL falla en desarrollo
function fallbackToSQLite() {
  if (process.env.VERCEL) return;
  console.warn('⚠️  Fallback a SQLite para desarrollo local.');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './database.sqlite',
    logging: false,
  });
}

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.warn('✅ Database connection established successfully');
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    if (process.env.VERCEL) throw error;
    fallbackToSQLite();
  }
};

// Initialize database — aplica migraciones versionadas (ya no sync() implícito).
const initializeDatabase = async () => {
  try {
    await testConnection();
    // Lazy require para evitar dependencia circular con el migrator.
    const { runMigrations } = require('./migrator');
    const applied = await runMigrations(sequelize);
    console.warn(
      `✅ Database migrations up to date${applied.length ? ` (applied ${applied.length})` : ''}`
    );
  } catch (error) {
    console.error('❌ Database migration failed:', error.message);
    if (process.env.VERCEL) throw error;
  }
};

module.exports = {
  sequelize,
  initializeDatabase
};