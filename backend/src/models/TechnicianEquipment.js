const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TechnicianEquipment = sequelize.define('TechnicianEquipment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  technicianId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  equipmentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'equipment',
      key: 'id'
    }
  },
  assignedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'technician_equipment',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['technicianId', 'equipmentId']
    }
  ]
});

module.exports = TechnicianEquipment;