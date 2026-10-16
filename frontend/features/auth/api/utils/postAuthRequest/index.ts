import { API_BASE_URL } from '@/api';

/**
 * Send a JSON POST to an authentication endpoint.
 *
 * Performs a network request and does not automatically attach session tokens.
 *
 * @param path - Endpoint suffix relative to /auth/, without a leading slash.
 * @param body - JSON-serializable request body.
 * @returns The raw Response, including non-OK responses; callers handle status and parsing.
 *   Serialization and fetch failures propagate.
 * @example
 * const response = await postAuthRequest('login', { email: 'reader@example.com', password: 'example-password' });
 * // => the server's Response, without status validation
 */
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
