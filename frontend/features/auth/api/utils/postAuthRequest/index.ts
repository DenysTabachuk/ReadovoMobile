import { API_BASE_URL } from '@/api';

export function postAuthRequest(
  path: string,
  body: unknown,
): Promise<Response> {
  return fetch(`${API_BASE_URL}/auth/${path}`, {
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
}
