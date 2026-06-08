const request = require('supertest');
const app = require('../app');
const { User, RevokedToken } = require('../models');

// ---------------------------------------------------------------------------
// Helper: safely extract the refreshToken cookie from a response.
// FIX: Previously, calling .find() directly on res.headers['set-cookie']
// would throw a TypeError if the header was absent (e.g., login fails
// unexpectedly). This helper surfaces a clear assertion failure instead.
// ---------------------------------------------------------------------------
const getRefreshCookie = (res) => {
  const cookies = res.headers['set-cookie'];
  expect(cookies).toBeDefined(); // Guard: ensures login actually set cookies
  const cookie = cookies.find((c) => c.startsWith('refreshToken='));
  expect(cookie).toBeDefined(); // Guard: ensures refreshToken cookie exists
  return cookie;
};

describe('Refresh Token Revocation Integration Tests', () => {
  beforeEach(async () => {
    // Arrange: clean slate before each test (isolation)
    await RevokedToken.destroy({ where: {} });
    await User.destroy({ where: {} });
    // Use plain-text password — the User model's beforeSave hook hashes it
    await User.create({
      username: 'revuser',
      email: 'rev@example.com',
      password: 'password123',
      role: 'admin',
      isActive: true
    });
  });

  const loginAs = () =>
    request(app).post('/api/auth/login').send({ email: 'rev@example.com', password: 'password123' });

  it('should revoke the used refresh token so it cannot be reused (token rotation)', async () => {
    // Arrange
    const loginRes = await loginAs().expect(200);
    const oldRefreshCookie = getRefreshCookie(loginRes);

    // Act: first use rotates correctly
    await request(app)
      .post('/api/auth/refresh-token')
      .set('Cookie', oldRefreshCookie)
      .expect(200);

    // Assert: reusing the rotated (now revoked) token must fail
    const reuseRes = await request(app)
      .post('/api/auth/refresh-token')
      .set('Cookie', oldRefreshCookie)
      .expect(401);

    expect(reuseRes.body.message).toMatch(/revoked/i);
  });

  it('should revoke the refresh token on logout, preventing further refreshes', async () => {
    // Arrange
    const loginRes = await loginAs().expect(200);
    const refreshCookie = getRefreshCookie(loginRes);
    const accessToken = loginRes.body.token;

    // Act: log out with the valid refresh token
    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', refreshCookie)
      .expect(200);

    // Assert: the revoked token is rejected on the next refresh attempt
    const afterLogoutRes = await request(app)
      .post('/api/auth/refresh-token')
      .set('Cookie', refreshCookie)
      .expect(401);

    expect(afterLogoutRes.body.message).toMatch(/revoked/i);
  });

  it('should issue a unique refresh token (different jti) on every login', async () => {
    // Arrange & Act: perform two independent logins
    const login1 = await loginAs().expect(200);
    const login2 = await loginAs().expect(200);

    // Assert: each session must receive a distinct token
    const cookie1 = getRefreshCookie(login1);
    const cookie2 = getRefreshCookie(login2);
    expect(cookie1).not.toBe(cookie2);
  });
});
