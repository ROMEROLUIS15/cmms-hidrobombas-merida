const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AdminTechnician = sequelize.define('AdminTechnician', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  adminId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  technicianId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  assignedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'admin_technicians',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['adminId', 'technicianId']
    }
  ]
});

module.exports = AdminTechnician;