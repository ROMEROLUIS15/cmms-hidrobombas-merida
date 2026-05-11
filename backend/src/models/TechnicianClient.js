const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TechnicianClient = sequelize.define('TechnicianClient', {
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
  clientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'clients',
      key: 'id'
    }
  },
  assignedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'technician_clients',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['technicianId', 'clientId']
    }
  ]
});

module.exports = TechnicianClient;