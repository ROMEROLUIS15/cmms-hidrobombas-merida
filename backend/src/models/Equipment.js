const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * ÚNICA fuente de verdad de los estados de un equipo. Deben coincidir con el
 * enum `enum_equipment_status` de Postgres (creado por la migración 0001).
 *
 * Existe porque el controlador y los validadores tenían sus PROPIAS listas
 * (`active`/`inactive`/`maintenance`), que no coincidían con la BD: crear un
 * equipo fallaba SIEMPRE en producción con
 * `invalid input value for enum enum_equipment_status: "active"`.
 */
const EQUIPMENT_STATUSES = ['Operativo', 'En Mantenimiento', 'Dañado'];
const DEFAULT_EQUIPMENT_STATUS = 'Operativo';

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
    type: DataTypes.ENUM(...EQUIPMENT_STATUSES),
    defaultValue: DEFAULT_EQUIPMENT_STATUS,
    allowNull: false
  }
  // clientId will be added automatically via association
}, {
  tableName: 'equipment',
  timestamps: true
});

Equipment.EQUIPMENT_STATUSES = EQUIPMENT_STATUSES;
Equipment.DEFAULT_EQUIPMENT_STATUS = DEFAULT_EQUIPMENT_STATUS;

module.exports = Equipment;
module.exports.EQUIPMENT_STATUSES = EQUIPMENT_STATUSES;
module.exports.DEFAULT_EQUIPMENT_STATUS = DEFAULT_EQUIPMENT_STATUS;
