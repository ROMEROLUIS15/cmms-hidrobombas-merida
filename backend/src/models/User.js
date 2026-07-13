const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

/**
 * ÚNICA fuente de verdad de los roles. Deben coincidir con el enum
 * `enum_users_role` de Postgres. Ojo: **`'user'` NO es un rol válido** — los
 * tests lo usaban y SQLite lo aceptaba, pero Postgres lo rechaza.
 */
const USER_ROLES = ['admin', 'supervisor', 'technician', 'client'];
const DEFAULT_USER_ROLE = 'technician';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      len: [3, 50],
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  role: {
    type: DataTypes.ENUM(...USER_ROLES),
    defaultValue: DEFAULT_USER_ROLE,
    allowNull: false
  },
  googleId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password')) {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
        user.password = await bcrypt.hash(user.password, saltRounds);
      }
    }
  }
});

// Instance method to compare password
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to exclude password from JSON
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  delete values.googleId;
  return values;
};

module.exports = User;
module.exports.USER_ROLES = USER_ROLES;
module.exports.DEFAULT_USER_ROLE = DEFAULT_USER_ROLE;