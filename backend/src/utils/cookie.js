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

const clearAuthCookies = (res) => {
  res.clearCookie('token', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
};

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