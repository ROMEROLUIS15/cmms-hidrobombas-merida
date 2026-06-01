const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/'
};

const refreshCookieOptions = {
  ...cookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

/**
 * Clear both auth cookies (token + refreshToken)
 * @param {import('express').Response} res
 */
const clearAuthCookies = (res) => {
  res.clearCookie('token', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
};

/**
 * Set auth cookies (token + optional refreshToken)
 * @param {import('express').Response} res
 * @param {string} token - JWT access token
 * @param {string|null} [refreshToken] - JWT refresh token
 */
const setAuthCookies = (res, token, refreshToken = null) => {
  res.cookie('token', token, {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });

  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);
  }
};

module.exports = {
  cookieOptions,
  refreshCookieOptions,
  clearAuthCookies,
  setAuthCookies
};