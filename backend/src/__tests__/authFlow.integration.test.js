const request = require('supertest');
const app = require('../app');
const { User } = require('../models');
const jwt = require('jsonwebtoken');

/**
 * Flujo de registro con aprobación por administrador (diseño intencional):
 *   1. El técnico se registra → cuenta PENDIENTE (isActive:false), sin sesión.
 *   2. No puede iniciar sesión hasta ser aprobado.
 *   3. Un admin lo aprueba vía PUT /api/users/:id/status.
 *   4. Ahora el técnico inicia sesión correctamente.
 */
describe('Auth flow: registro → aprobación admin → login', () => {
  let admin;
  let adminToken;

  beforeEach(async () => {
    await User.destroy({ where: {} });
    admin = await User.create({
      username: 'Admin Root',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      isActive: true
    });
    adminToken = jwt.sign(
      { userId: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || 'test_secret_for_testing_only',
      { expiresIn: '1d' }
    );
  });

  it('registra como pendiente, sin emitir sesión', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ full_name: 'Tecnico Uno', email: 'tec1@example.com', password: 'password123' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/aprobar/i);
    expect(res.body.token).toBeUndefined();
    // No debe setear cookies de sesión en el registro.
    expect(res.headers['set-cookie']).toBeUndefined();

    const created = await User.findOne({ where: { email: 'tec1@example.com' } });
    expect(created.isActive).toBe(false);
    expect(created.role).toBe('technician');
  });

  it('bloquea el login de una cuenta pendiente con mensaje claro', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ full_name: 'Tecnico Dos', email: 'tec2@example.com', password: 'password123' })
      .expect(201);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tec2@example.com', password: 'password123' })
      .expect(401);

    expect(res.body.message).toMatch(/pendiente de aprobación/i);
  });

  it('permite el login tras la aprobación del administrador', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ full_name: 'Tecnico Tres', email: 'tec3@example.com', password: 'password123' })
      .expect(201);

    const created = await User.findOne({ where: { email: 'tec3@example.com' } });

    // Admin aprueba la cuenta.
    await request(app)
      .put(`/api/users/${created.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: true })
      .expect(200);

    // Ahora el técnico puede iniciar sesión y recibe token.
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tec3@example.com', password: 'password123' })
      .expect(200);

    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.token).toBeDefined();
    expect(loginRes.body.user.email).toBe('tec3@example.com');
  });
});
