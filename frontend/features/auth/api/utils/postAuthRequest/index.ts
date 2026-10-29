import { type AxiosResponse } from 'axios';
import { httpClient } from '@/api/httpClient';
import { API_BASE_URL } from '@/api';

/**
 * Send a JSON POST to an authentication endpoint.
 *
 * Performs a network request and does not automatically attach session tokens.
 *
 * @param path - Endpoint suffix relative to /auth/, without a leading slash.
 * @param body - JSON-serializable request body.
 * @returns The parsed successful response; HTTP errors reject for endpoint-specific mapping.
 *   Serialization and transport failures propagate.
 * @example
 * const response = await postAuthRequest('login', { email: 'reader@example.com', password: 'example-password' });
 * // => the server's status and parsed data, without credentials
 */
export function postAuthRequest(
  path: string,
  body: unknown,
): Promise<AxiosResponse<unknown>> {
  return httpClient(`${API_BASE_URL}/auth/${path}`, {
    data: body,
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
}
