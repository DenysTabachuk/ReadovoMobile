import { getDevServerHost } from '@/utils/getDevServerHost';

const DEFAULT_API_PORT = '3000';

function resolveApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (configuredUrl) {
    return configuredUrl;
  }

  return `http://${getDevServerHost()}:${DEFAULT_API_PORT}`;
}

export const API_BASE_URL = resolveApiBaseUrl();
