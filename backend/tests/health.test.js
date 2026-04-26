const request = require('supertest');
const app = require('../src/app');

describe('Health Check API', () => {
  it('should return 200 and a success message for the base health check', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Server is running');
    expect(response.body.database).toBe('sqlite-sequelize');
  });

  it('should return 200 for the root endpoint', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('CMMS Hidrobombas API');
  });
});
