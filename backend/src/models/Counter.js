const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Counter — secuencias monótonas con nombre.
 *
 * Fuente de verdad para números legibles que NO deben reutilizarse (p. ej. el
 * `reportNumber` de los reportes de servicio). A diferencia de `count()`, el
 * valor solo crece: borrar filas no baja el contador, así que nunca se reasigna
 * un número ya emitido. El incremento se hace dentro de una transacción con
 * bloqueo de fila (`FOR UPDATE` en Postgres) para ser seguro ante concurrencia.
 */
const Counter = sequelize.define('Counter', {
  name: {
    type: DataTypes.STRING(64),
    primaryKey: true,
    allowNull: false
  },
  value: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'counters',
  timestamps: true
});

module.exports = Counter;
