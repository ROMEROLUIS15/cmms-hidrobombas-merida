const { sequelize } = require('../config/database');

beforeAll(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  } catch (error) {
    console.error('Unable to connect to database for tests:', error);
  }
});

afterAll(async () => {
  await sequelize.close();
});
