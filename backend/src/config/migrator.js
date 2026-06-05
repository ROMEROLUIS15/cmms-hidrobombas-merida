const fs = require('fs');
const path = require('path');
const { DataTypes } = require('sequelize');
const { sequelize: defaultSequelize } = require('./database');
const { logger } = require('../utils/logger');

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');
const META_TABLE = 'SequelizeMeta';

/**
 * Crea la tabla de control de migraciones si no existe.
 */
async function ensureMetaTable(db) {
  const qi = db.getQueryInterface();
  const tables = await qi.showAllTables();
  const names = tables.map((t) => (typeof t === 'string' ? t : t.tableName));
  if (!names.includes(META_TABLE)) {
    await qi.createTable(META_TABLE, {
      name: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
    });
  }
}

/** @returns {Promise<string[]>} nombres de migraciones ya aplicadas */
async function getApplied(db) {
  const [rows] = await db.query(`SELECT name FROM "${META_TABLE}"`);
  return rows.map((r) => r.name);
}

/** @returns {string[]} archivos de migración ordenados */
function listMigrations() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.js'))
    .sort();
}

/**
 * Aplica las migraciones pendientes en orden y las registra.
 * @param {import('sequelize').Sequelize} [db] - instancia activa (por defecto la del módulo).
 * @returns {Promise<string[]>} migraciones aplicadas en esta ejecución.
 */
async function runMigrations(db = defaultSequelize) {
  await ensureMetaTable(db);
  const applied = await getApplied(db);
  const pending = listMigrations().filter((f) => !applied.includes(f));

  const context = { sequelize: db, queryInterface: db.getQueryInterface(), DataTypes };

  for (const file of pending) {
    const migration = require(path.join(MIGRATIONS_DIR, file));
    await migration.up(context);
    await db.query(`INSERT INTO "${META_TABLE}" (name) VALUES (:name)`, {
      replacements: { name: file },
    });
    logger.info('Migration applied', { migration: file });
  }

  return pending;
}

/**
 * Estado de migraciones: aplicadas y pendientes.
 * @param {import('sequelize').Sequelize} [db]
 * @returns {Promise<{applied: string[], pending: string[]}>}
 */
async function migrationStatus(db = defaultSequelize) {
  await ensureMetaTable(db);
  const applied = await getApplied(db);
  const pending = listMigrations().filter((f) => !applied.includes(f));
  return { applied, pending };
}

module.exports = { runMigrations, migrationStatus, listMigrations, MIGRATIONS_DIR };
