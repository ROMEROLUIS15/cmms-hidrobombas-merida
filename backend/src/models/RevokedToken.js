const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Denylist de refresh tokens revocados (por logout o rotación).
 * Se identifica cada refresh token por su `jti`. Las entradas pueden purgarse
 * una vez superado `expiresAt` (cuando el token ya habría caducado por sí solo).
 */
const RevokedToken = sequelize.define('RevokedToken', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  jti: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'revoked_tokens',
  timestamps: true,
  indexes: [
    { fields: ['expiresAt'] }
  ]
});

module.exports = RevokedToken;
