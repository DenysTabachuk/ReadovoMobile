import { API_BASE_URL } from '../../config';

const MOCK_API_PORT = '3101';

export function isMockApiEnabled(): boolean {
  return API_BASE_URL.includes(`:${MOCK_API_PORT}`);
}
