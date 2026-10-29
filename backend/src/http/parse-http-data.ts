import {
  type AxiosRequestConfig,
  type AxiosResponseHeaders,
  type RawAxiosResponseHeaders,
} from 'axios';

/**
 * Parses Axios response JSON while preserving text endpoints and non-JSON errors.
 * @this Axios request configuration; responseType 'text' bypasses JSON parsing.
 * @param data - Adapter response data; non-string values and status 204 pass through.
 * @param _headers - Response headers supplied by Axios; unused by this transform.
 * @param status - Optional HTTP status. Malformed JSON passes through unchanged
 * unless the status explicitly indicates a successful response (200–299).
 * @returns Parsed JSON, or the original data for bypassed/unparseable responses.
 * No input is mutated.
 * @throws {SyntaxError} When a non-text, non-204 successful response has invalid JSON.
 * @example
 * parseHttpData.call({ responseType: 'json' }, '{"id":1}', {}, 200); // => { id: 1 }
 * parseHttpData.call({ responseType: 'json' }, 'Unavailable', {}, 503); // => 'Unavailable'
 */
export function parseHttpData(
  this: AxiosRequestConfig,
  data: unknown,
  _headers: AxiosResponseHeaders | RawAxiosResponseHeaders,
  status?: number,
): unknown {
  if (
    this.responseType === 'text' ||
    typeof data !== 'string' ||
    status === 204
  )
    return data;
  try {
    return JSON.parse(data);
  } catch (error) {
    if (status !== undefined && status >= 200 && status < 300) throw error;
    return data;
  }
}
