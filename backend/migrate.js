/* CLI de migraciones.
 * Uso:
 *   node migrate.js          -> aplica migraciones pendientes
 *   node migrate.js status   -> muestra aplicadas / pendientes
 */
require('dotenv').config();
const { sequelize } = require('./src/config/database');
require('./src/models'); // registra los modelos (necesario para el baseline)
const { runMigrations, migrationStatus } = require('./src/config/migrator');

(async () => {
  const command = process.argv[2] || 'up';
  try {
    await sequelize.authenticate();

    if (command === 'status') {
      const { applied, pending } = await migrationStatus(sequelize);
      console.log('Aplicadas:', applied.length ? applied.join(', ') : '(ninguna)');
      console.log('Pendientes:', pending.length ? pending.join(', ') : '(ninguna)');
    } else {
      const applied = await runMigrations(sequelize);
      console.log(
        applied.length ? `Migraciones aplicadas: ${applied.join(', ')}` : 'Sin migraciones pendientes.'
      );
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error de migración:', error.message);
    process.exit(1);
  }
})();
