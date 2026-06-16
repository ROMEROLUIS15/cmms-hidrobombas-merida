const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const IdempotencyKey = sequelize.define('IdempotencyKey', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    field: 'idempotency_key'
  },
  method: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  path: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  // Nullable: la clave se "reserva" (fila creada) ANTES de procesar la
  // petición; el status/body se rellenan al responder. Una fila con estos
  // campos en null representa una petición en vuelo.
  responseStatus: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  responseBody: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'idempotency_keys',
  timestamps: true,
  indexes: [
    {
      fields: ['expiresAt']
    }
  ]
});

module.exports = IdempotencyKey;