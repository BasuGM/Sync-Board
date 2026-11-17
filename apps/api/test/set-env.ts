process.env.DATABASE_URL ??=
  'postgresql://syncboard:syncboard_dev_password@localhost:5432/syncboard?schema=public';
process.env.PORT ??= '3001';
process.env.API_CORS_ORIGIN ??= 'http://localhost:3000';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret';
process.env.JWT_ACCESS_EXPIRES_IN ??= '15m';
process.env.JWT_REFRESH_EXPIRES_DAYS ??= '7';
process.env.REFRESH_COOKIE_NAME ??= 'syncboard_refresh';
