process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_for_testing_only';
process.env.JWT_EXPIRES_IN = '1d';
process.env.VERCEL = '';

// Por defecto los tests corren contra SQLite en memoria: rápido y sin
// dependencias. PERO SQLite NO valida ENUM ni UUID, y Postgres sí: eso dejó
// pasar bugs que solo reventaban en producción (crear un equipo fallaba SIEMPRE
// con `invalid input value for enum enum_equipment_status`). Ver TECH_DEBT #3.5.
//
// Si el entorno ya trae DATABASE_URL (el job de Postgres del CI, o una BD de
// pruebas local), la respetamos y la suite corre contra Postgres de verdad.
if (!process.env.DATABASE_URL) {
  process.env.DB_STORAGE = ':memory:';
  process.env.DATABASE_URL = '';
}
