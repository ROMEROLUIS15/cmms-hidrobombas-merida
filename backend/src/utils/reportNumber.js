const { sequelize } = require('../config/database');
const { Counter, ServiceReport } = require('../models');

const COUNTER_NAME = 'service_report';
const PREFIX = 'SRV-';
const PAD = 4;

/** Extrae el número secuencial de un reportNumber tipo "SRV-0042" → 42. */
const parseSeq = (reportNumber) => {
  const match = /SRV-(\d+)/.exec(reportNumber || '');
  return match ? parseInt(match[1], 10) : 0;
};

/** Mayor secuencia ya emitida según las filas existentes (para inicializar el contador). */
const currentMaxSeq = async (transaction) => {
  const rows = await ServiceReport.findAll({ attributes: ['reportNumber'], transaction });
  return rows.reduce((max, r) => Math.max(max, parseSeq(r.reportNumber)), 0);
};

/**
 * Devuelve el siguiente número de reporte ("SRV-XXXX") de forma atómica y
 * monótona. Seguro ante concurrencia (bloqueo de fila del contador) y ante
 * borrados (el contador nunca decrece, así que no reutiliza números).
 *
 * La primera vez inicializa el contador con el máximo existente, de modo que
 * BDs ya pobladas continúan la secuencia sin colisiones.
 * @returns {Promise<string>}
 */
const nextReportNumber = async () => {
  return sequelize.transaction(async (t) => {
    let row = await Counter.findOne({
      where: { name: COUNTER_NAME },
      lock: t.LOCK.UPDATE,
      transaction: t
    });

    if (!row) {
      const seed = await currentMaxSeq(t);
      row = await Counter.create({ name: COUNTER_NAME, value: seed }, { transaction: t });
    }

    const next = row.value + 1;
    await row.update({ value: next }, { transaction: t });
    return `${PREFIX}${String(next).padStart(PAD, '0')}`;
  });
};

module.exports = { nextReportNumber, COUNTER_NAME, parseSeq };
