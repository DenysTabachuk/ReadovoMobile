import { API_BASE_URL } from '../../config';

const MOCK_API_PORT = '3101';

/**
 * Detect whether the configured API URL points to the mock server port.
 *
 * @returns True when the URL's port is exactly the mock port; false for malformed URLs.
 *   This does not check server availability.
 * @example
 * // With API_BASE_URL set to 'http://localhost:3101':
 * isMockApiEnabled();
 * // => true
 */
export function isMockApiEnabled(): boolean {
  try {
    return new URL(API_BASE_URL).port === MOCK_API_PORT;
  } catch {
    return false;
  }
}
