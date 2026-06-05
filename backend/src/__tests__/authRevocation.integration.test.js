const request = require('supertest');
const app = require('../app');
const { User, RevokedToken } = require('../models');

describe('Refresh token revocation', () => {
  beforeEach(async () => {
    await RevokedToken.destroy({ where: {} });
    await User.destroy({ where: {} });
    // El hook beforeSave del modelo hashea la contraseña en texto plano.
    await User.create({
      username: 'revuser',
      email: 'rev@example.com',
      password: 'password123',
      role: 'admin',
      isActive: true
    });
  });

  const login = () =>
    request(app).post('/api/auth/login').send({ email: 'rev@example.com', password: 'password123' });

  const refreshCookieOf = (res) =>
    res.headers['set-cookie'].find((c) => c.startsWith('refreshToken='));

  it('rota el refresh token y revoca el usado (no se puede reutilizar)', async () => {
    const loginRes = await login().expect(200);
    const oldRefresh = refreshCookieOf(loginRes);

    // Primer uso: rota correctamente.
    await request(app)
      .post('/api/auth/refresh-token')
      .set('Cookie', oldRefresh)
      .expect(200);

    // Reutilizar el token viejo (ya rotado) ahora falla.
    const reuse = await request(app)
      .post('/api/auth/refresh-token')
      .set('Cookie', oldRefresh)
      .expect(401);

    expect(reuse.body.message).toMatch(/revoked/i);
  });

  it('revoca el refresh token en logout', async () => {
    const loginRes = await login().expect(200);
    const refreshCookie = refreshCookieOf(loginRes);
    const accessToken = loginRes.body.token;

    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', refreshCookie)
      .expect(200);

    const afterLogout = await request(app)
      .post('/api/auth/refresh-token')
      .set('Cookie', refreshCookie)
      .expect(401);

    expect(afterLogout.body.message).toMatch(/revoked/i);
  });

  it('emite un jti distinto en cada refresh token (rotación real)', async () => {
    const r1 = await login().expect(200);
    const r2 = await login().expect(200);
    expect(refreshCookieOf(r1)).not.toBe(refreshCookieOf(r2));
  });
});
