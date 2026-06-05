/**
 * Global setup para los tests e2e.
 *
 * Siembra un usuario admin ACTIVO directamente en la misma SQLite que usa el
 * backend en desarrollo. Es necesario porque el registro publico crea cuentas
 * con isActive=false (requieren verificacion por email), por lo que un usuario
 * registrado via API no puede iniciar sesion. Mismo patron que bootstrap-admin.js.
 */
const path = require('path');

const E2E_USER = {
  username: 'E2E Admin',
  email: 'e2e.admin@hidrobombas.test',
  password: 'E2ePass123!',
  role: 'admin',
};

module.exports = async () => {
  // Forzar SQLite sobre una BD DEDICADA para e2e (no la database.sqlite real).
  // El webServer de Playwright arranca el backend con este mismo DB_STORAGE.
  delete process.env.DATABASE_URL;
  process.env.DB_STORAGE = path.resolve(__dirname, '..', 'backend', 'e2e-test.sqlite');

  const { sequelize } = require('../backend/src/config/database');
  const { User } = require('../backend/src/models');

  await sequelize.sync(); // asegura que la tabla users exista antes de sembrar
  await User.destroy({ where: { email: E2E_USER.email } });
  await User.create({ ...E2E_USER, isActive: true });
  await sequelize.close();
};

module.exports.E2E_USER = E2E_USER;
