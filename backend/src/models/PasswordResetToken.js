const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * PasswordResetToken: Stores one-time tokens for password recovery.
 * Each token expires after 1 hour and is deleted after use.
 */
const PasswordResetToken = sequelize.define('PasswordResetToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  token: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
  // userId will be added via association
}, {
  tableName: 'password_reset_tokens',
  timestamps: true
});

module.exports = PasswordResetToken;
