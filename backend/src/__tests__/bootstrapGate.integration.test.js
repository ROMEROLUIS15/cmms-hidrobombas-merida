const request = require('supertest');
const app = require('../app');
const { User } = require('../models');
const { sequelize } = require('../config/database');

/**
 * El punto muerto que estos tests blindan: el auto-registro crea técnicos
 * PENDIENTES y solo un admin puede aprobarlos. Con cero admins, registrarse
 * produce cuentas que nadie podrá desbloquear nunca.
 * Ocurrió de verdad en producción (2026-07-12).
 */
describe('Gate de inicialización (no hay admin)', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.sync({ force: true });
  });

  const registerPayload = {
    fullName: 'Técnico Nuevo',
    email: 'tecnico.nuevo@example.com',
    password: 'password123',
  };

  const createAdmin = (overrides = {}) =>
    User.create({
      username: 'Admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      isActive: true,
      ...overrides,
    });

  describe('sin ningún admin', () => {
    it('rechaza el registro con 409 en vez de crear una cuenta muerta', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(registerPayload)
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('SYSTEM_NOT_INITIALIZED');

      // Lo importante: NO quedó ningún usuario huérfano en la BD.
      expect(await User.count()).toBe(0);
    });

    it('bootstrap-status avisa de que falta inicializar', async () => {
      const res = await request(app)
        .get('/api/auth/bootstrap-status')
        .expect(200);

      expect(res.body.data.needsBootstrap).toBe(true);
      expect(res.body.data.registrationOpen).toBe(false);
    });
  });

  describe('con un admin INACTIVO', () => {
    it('sigue bloqueando: un admin que no puede entrar tampoco puede aprobar', async () => {
      await createAdmin({ isActive: false });

      await request(app)
        .post('/api/auth/register')
        .send(registerPayload)
        .expect(409);

      const res = await request(app).get('/api/auth/bootstrap-status').expect(200);
      expect(res.body.data.needsBootstrap).toBe(true);
    });
  });

  describe('con un admin activo', () => {
    beforeEach(async () => {
      await createAdmin();
    });

    it('permite el registro y la cuenta queda pendiente de aprobación', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(registerPayload)
        .expect(201);

      expect(res.body.success).toBe(true);

      const created = await User.findOne({ where: { email: registerPayload.email } });
      expect(created.role).toBe('technician');
      expect(created.isActive).toBe(false);
    });

    it('bootstrap-status reporta el sistema ya inicializado', async () => {
      const res = await request(app)
        .get('/api/auth/bootstrap-status')
        .expect(200);

      expect(res.body.data.needsBootstrap).toBe(false);
      expect(res.body.data.registrationOpen).toBe(true);
    });

    it('el registro NO puede auto-promoverse a admin aunque lo pida en el body', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ ...registerPayload, role: 'admin' })
        .expect(201);

      const created = await User.findOne({ where: { email: registerPayload.email } });
      expect(created.role).toBe('technician');
    });
  });
});
