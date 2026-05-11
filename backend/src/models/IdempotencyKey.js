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
  responseStatus: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  responseBody: {
    type: DataTypes.TEXT,
    allowNull: false
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