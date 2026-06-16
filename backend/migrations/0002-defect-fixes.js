/**
 * Migración 0002 — correcciones de defectos.
 *
 * Lleva BDs ya desplegadas (creadas con el esquema anterior vía baseline/sync)
 * al nuevo esquema. Es defensiva e idempotente: comprueba el estado actual antes
 * de cada cambio, de modo que es segura tanto sobre una BD recién sincronizada
 * desde los modelos (tests) como sobre una BD productiva antigua.
 *
 *  1. Tabla `counters` (secuencias monótonas) + backfill del contador de reportes.
 *  2. Índice único en `service_reports.reportNumber`.
 *  3. `idempotency_keys.responseStatus` / `responseBody` pasan a NULLABLE.
 */
module.exports = {
  async up({ queryInterface, sequelize, DataTypes }) {
    const qi = queryInterface;

    const tables = await qi.showAllTables();
    const tableNames = tables.map((t) => (typeof t === 'string' ? t : t.tableName));

    // ── 1. Tabla counters ──────────────────────────────────────────────────────
    if (!tableNames.includes('counters')) {
      await qi.createTable('counters', {
        name: { type: DataTypes.STRING(64), primaryKey: true, allowNull: false },
        value: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
      });
    }

    // Backfill: inicializa el contador 'service_report' con el máximo ya emitido.
    if (tableNames.includes('service_reports')) {
      const [existing] = await sequelize.query(
        'SELECT name FROM counters WHERE name = :n',
        { replacements: { n: 'service_report' } }
      );
      if (existing.length === 0) {
        const [rows] = await sequelize.query(
          'SELECT "reportNumber" FROM service_reports WHERE "reportNumber" IS NOT NULL'
        );
        let max = 0;
        for (const r of rows) {
          const m = /SRV-(\d+)/.exec(r.reportNumber);
          if (m) max = Math.max(max, parseInt(m[1], 10));
        }
        await sequelize.query(
          `INSERT INTO counters (name, value, "createdAt", "updatedAt")
           VALUES ('service_report', :v, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          { replacements: { v: max } }
        );
      }
    }

    // ── 2. Índice único en service_reports.reportNumber ─────────────────────────
    if (tableNames.includes('service_reports')) {
      let hasUnique;
      try {
        const indexes = await qi.showIndex('service_reports');
        hasUnique = indexes.some(
          (idx) =>
            idx.unique &&
            (idx.fields || []).some((f) => (f.attribute || f.columnName) === 'reportNumber')
        );
      } catch {
        hasUnique = false;
      }
      if (!hasUnique) {
        await qi.addIndex('service_reports', ['reportNumber'], {
          unique: true,
          name: 'service_reports_report_number_unique',
        });
      }
    }

    // ── 3. idempotency_keys: columnas de respuesta nullable ─────────────────────
    if (tableNames.includes('idempotency_keys')) {
      const desc = await qi.describeTable('idempotency_keys');
      if (desc.responseStatus && desc.responseStatus.allowNull === false) {
        await qi.changeColumn('idempotency_keys', 'responseStatus', {
          type: DataTypes.INTEGER,
          allowNull: true,
        });
      }
      if (desc.responseBody && desc.responseBody.allowNull === false) {
        await qi.changeColumn('idempotency_keys', 'responseBody', {
          type: DataTypes.TEXT,
          allowNull: true,
        });
      }
    }
  },

  async down() {
    // No revertimos: el cambio es aditivo/no destructivo.
  },
};
