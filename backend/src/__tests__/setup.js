const { sequelize } = require('../config/database');

/**
 * Prepara una BD limpia antes de cada archivo de tests.
 *
 * En SQLite basta con `sync({ force: true })`. En Postgres NO: `sync` recrea las
 * tablas pero deja atrás los tipos ENUM, y la recreación acaba fallando con
 * `type "public.enum_service_reports_visitType" does not exist`. Hay que partir
 * de un schema vacío.
 */
const isPostgres = () => sequelize.getDialect() === 'postgres';

/**
 * SALVAGUARDA: `DROP SCHEMA public CASCADE` borra la BD entera. Si alguien
 * ejecuta la suite con DATABASE_URL apuntando por error a producción, se lleva
 * por delante todos los datos. Exigimos que el nombre de la base delate que es
 * de pruebas.
 */
const assertTestDatabase = () => {
  const name = sequelize.getDatabaseName();
  if (!/test/i.test(name)) {
    throw new Error(
      `NEGATIVA A BORRAR: la suite iba a hacer DROP SCHEMA sobre la base "${name}", ` +
      'cuyo nombre no contiene "test". Apunta DATABASE_URL a una base de PRUEBAS ' +
      '(p. ej. cmms_test) — nunca a producción.'
    );
  }
};

beforeAll(async () => {
  await sequelize.authenticate();

  if (isPostgres()) {
    assertTestDatabase();
    await sequelize.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  }

  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});
