import { getDevServerHost } from '@/utils/devServerHost';

const API_PORT = '3000';

function getApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (configuredUrl) {
    return configuredUrl;
  }

  return `http://${getDevServerHost()}:${API_PORT}`;
}

export const API_BASE_URL = getApiBaseUrl();

export function isMockApiEnabled(): boolean {
  return API_BASE_URL.includes(':3101');
}
