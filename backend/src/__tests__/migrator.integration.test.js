const { runMigrations, migrationStatus, listMigrations } = require('../config/migrator');
const { sequelize } = require('../config/database');
require('../models');

describe('migrator', () => {
  it('incluye la migración baseline', () => {
    expect(listMigrations()).toContain('0001-initial-baseline.js');
  });

  it('aplica las migraciones y deja el estado sin pendientes', async () => {
    await runMigrations(sequelize);
    const status = await migrationStatus(sequelize);
    expect(status.pending).toHaveLength(0);
    expect(status.applied).toContain('0001-initial-baseline.js');
  });

  it('es idempotente: una segunda ejecución no aplica nada', async () => {
    const applied = await runMigrations(sequelize);
    expect(applied).toHaveLength(0);
  });

  it('registra las migraciones en SequelizeMeta', async () => {
    await runMigrations(sequelize);
    const [rows] = await sequelize.query('SELECT name FROM "SequelizeMeta"');
    expect(rows.map((r) => r.name)).toContain('0001-initial-baseline.js');
  });
});
