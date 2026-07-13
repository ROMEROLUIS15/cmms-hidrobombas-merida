const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * ÚNICA fuente de verdad de los tipos de visita. Deben coincidir con el enum
 * `enum_service_reports_visitType` de Postgres. El validador Zod los importa de
 * aquí: si acepta cualquier string, un valor inválido llega a la BD y Postgres
 * responde con un 500 en vez de un 400 limpio.
 */
const VISIT_TYPES = ['mensual', 'eventual', 'technical'];
const DEFAULT_VISIT_TYPE = 'mensual';

/**
 * ServiceReport — Reporte de Mantenimiento
 *
 * Almacena todos los datos de la hoja física de Hidrobombas Mérida.
 * Los bloques técnicos se guardan como JSON para máxima flexibilidad
 * con SQLite sin necesidad de múltiples tablas.
 */
const ServiceReport = sequelize.define('ServiceReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  // ── Cabecera ────────────────────────────────────────────────────────────────
  reportNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,  // Generated server-side before save
    unique: true      // Identificador visible: nunca debe duplicarse
  },
  reportDate: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  visitType: {
    type: DataTypes.ENUM(...VISIT_TYPES),
    defaultValue: DEFAULT_VISIT_TYPE,
    allowNull: false
  },
  systemName: {
    type: DataTypes.STRING(150),
    allowNull: true   // "Sistema de agua Torre A"
  },

  // ── Bloque 1: Agua / Energía ────────────────────────────────────────────────
  waterEnergyData: {
    type: DataTypes.TEXT,           // Stored as JSON string
    allowNull: true,
    get() {
      const raw = this.getDataValue('waterEnergyData');
      return raw ? JSON.parse(raw) : null;
    },
    set(value) {
      this.setDataValue('waterEnergyData', value ? JSON.stringify(value) : null);
    }
  },

  // ── Bloque 2: Motores (array de hasta 3) ────────────────────────────────────
  motorsData: {
    type: DataTypes.TEXT,           // Stored as JSON string [{motor1}, {motor2}, {motor3}]
    allowNull: true,
    get() {
      const raw = this.getDataValue('motorsData');
      return raw ? JSON.parse(raw) : [];
    },
    set(value) {
      this.setDataValue('motorsData', value ? JSON.stringify(value) : null);
    }
  },

  // ── Bloque 3: Control / Periféricos ─────────────────────────────────────────
  controlData: {
    type: DataTypes.TEXT,           // Stored as JSON string
    allowNull: true,
    get() {
      const raw = this.getDataValue('controlData');
      return raw ? JSON.parse(raw) : null;
    },
    set(value) {
      this.setDataValue('controlData', value ? JSON.stringify(value) : null);
    }
  },

  // ── Bloque 4: Cierre ────────────────────────────────────────────────────────
  observations: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  technicianName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  clientSignatureName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  clientSignature: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },

  // ── Campos legacy (mantener compatibilidad) ──────────────────────────────────
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  partsUsed: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  recommendations: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00
  }

  // equipmentId and userId are added automatically via associations in models/index.js
}, {
  tableName: 'service_reports',
  timestamps: true
});

module.exports = ServiceReport;
module.exports.VISIT_TYPES = VISIT_TYPES;
module.exports.DEFAULT_VISIT_TYPE = DEFAULT_VISIT_TYPE;
