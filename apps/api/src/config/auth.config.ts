import { registerAs } from '@nestjs/config';

export interface AuthConfig {
  accessTokenSecret: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresDays: number;
  refreshCookieName: string;
}

export default registerAs('auth', (): AuthConfig => ({
  accessTokenSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-only-change-me',
  accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  refreshTokenExpiresDays: Number(process.env.JWT_REFRESH_EXPIRES_DAYS ?? 7),
  refreshCookieName: process.env.REFRESH_COOKIE_NAME ?? 'syncboard_refresh',
}));
