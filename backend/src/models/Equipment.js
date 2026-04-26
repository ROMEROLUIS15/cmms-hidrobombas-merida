const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Equipment = sequelize.define('Equipment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  serialNumber: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  brand: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Operativo', 'En Mantenimiento', 'Dañado'),
    defaultValue: 'Operativo',
    allowNull: false
  }
  // clientId will be added automatically via association
}, {
  tableName: 'equipment',
  timestamps: true
});

module.exports = Equipment;
