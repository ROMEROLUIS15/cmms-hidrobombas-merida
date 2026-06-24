const { Sequelize } = require('sequelize');
require('dotenv').config();
const { logger } = require('../utils/logger');

// Driver serverless de Neon: conecta vía WebSocket sobre el puerto 443 en lugar
// de Postgres TCP por el 5432. Muchas redes (firewall/ISP/VPN) bloquean el 5432
// saliente y lo cortan con ECONNRESET; el 443 pasa sin problema. Es además el
// driver que Neon recomienda para entornos serverless (Vercel), donde evita
// agotar conexiones. Lo usamos como dialectModule de Sequelize (drop-in de `pg`).
let neonServerless = null;
try {
  neonServerless = require('@neondatabase/serverless');
  // En Node < 22 no hay WebSocket global; usamos el paquete `ws`.
  neonServerless.neonConfig.webSocketConstructor =
    typeof WebSocket !== 'undefined' ? WebSocket : require('ws');
} catch {
  // Ignorar si no está instalado (p. ej. entorno solo-SQLite para tests).
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
    // Conexión vía WebSocket (Neon serverless). Si por alguna razón el driver no
    // está disponible, Sequelize cae al `pg` estándar (TCP) y dialectOptions aplica.
    ...(neonServerless ? { dialectModule: neonServerless } : {}),
    dialectOptions: {
      // Verificamos la cadena de certificados TLS (antes estaba en `false`, lo
      // que aceptaba cualquier cert y abría la puerta a MITM en la conexión a la
      // DB). Neon emite certificados de una CA pública (Let's Encrypt / ISRG Root),
      // confiada por Node por defecto, así que la verificación pasa tanto en local
      // como en Vercel. Verificado contra la instancia real antes de endurecer.
      ssl: {
        rejectUnauthorized: true,
      },
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

// Fallback a SQLite — SOLO opt-in explícito (ALLOW_SQLITE_FALLBACK=true).
// Por defecto preferimos FALLAR de forma visible: un fallback silencioso oculta
// problemas de conexión a Neon y te hace desarrollar contra un motor distinto al
// de producción (pérdida de paridad).
const allowSqliteFallback = process.env.ALLOW_SQLITE_FALLBACK === 'true';

function fallbackToSQLite() {
  logger.warn('Database: ALLOW_SQLITE_FALLBACK activo → usando SQLite local en lugar de Postgres');
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
    logger.info('Database connection established', { dialect: sequelize.getDialect() });
  } catch (error) {
    logger.error('Database connection failed', { message: error.message });

    // En Vercel/producción nunca hay fallback: el error debe propagarse.
    if (process.env.VERCEL) throw error;

    // Si NO estábamos usando Postgres (DATABASE_URL vacía, p. ej. tests), el fallo
    // es de la propia SQLite y no hay nada a lo que caer: propágalo.
    if (!isPostgres) throw error;

    // Postgres falló en local. Solo caemos a SQLite si se pidió explícitamente.
    if (allowSqliteFallback) {
      fallbackToSQLite();
      return;
    }

    logger.error(
      'Conexión a Postgres (Neon) fallida. NO se hace fallback silencioso a SQLite. ' +
      'Revisa DATABASE_URL en backend/.env y la conectividad con Neon ' +
      '(https://status.neon.tech). Si de verdad quieres trabajar offline contra ' +
      'SQLite, ejecuta con ALLOW_SQLITE_FALLBACK=true.'
    );
    throw error;
  }
};

// Initialize database — aplica migraciones versionadas (ya no sync() implícito).
const initializeDatabase = async () => {
  try {
    await testConnection();
    // Lazy require para evitar dependencia circular con el migrator.
    const { runMigrations } = require('./migrator');
    const applied = await runMigrations(sequelize);
    logger.info('Database migrations up to date', { applied: applied.length });
  } catch (error) {
    logger.error('Database migration failed', { message: error.message });
    // Propagar siempre: un fallo de DB no debe dejar arrancar el servidor "sano".
    // server.js hace process.exit(1) en dev y relanza en Vercel.
    throw error;
  }
};

module.exports = {
  sequelize,
  initializeDatabase
};