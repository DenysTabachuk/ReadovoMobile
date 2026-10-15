import {
  AUTH_ACCESS_TOKEN_STORAGE_KEY,
  AUTH_REFRESH_TOKEN_STORAGE_KEY,
} from '../../session';

export const AUTH_STORAGE_KEYS = {
  accessToken: AUTH_ACCESS_TOKEN_STORAGE_KEY,
  refreshToken: AUTH_REFRESH_TOKEN_STORAGE_KEY,
  rememberMe: 'readovo.auth.rememberMe',
  userProfile: 'readovo.auth.userProfile',
} as const;
