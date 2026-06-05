/**
 * Migración base (baseline) del esquema existente.
 *
 * Este proyecto nació "model-first" (el esquema lo definían los modelos +
 * sequelize.sync()). Esta migración adopta un control de versiones formal:
 * crea las tablas definidas por los modelos SI no existen (no destructivo), de
 * modo que tanto una BD nueva como una ya desplegada quedan "baselined".
 *
 * A partir de aquí, TODO cambio de esquema debe ir en una migración incremental
 * nueva (p. ej. 0002-...-.js) con createTable/addColumn explícitos, en lugar de
 * depender de sync() en el arranque.
 */
module.exports = {
  async up({ sequelize }) {
    // Los modelos ya están registrados por quien invoca al migrator.
    // sync() sin force/alter solo crea tablas ausentes.
    await sequelize.sync();
  },

  async down() {
    // No revertimos el baseline para no arriesgar datos en producción.
  },
};
