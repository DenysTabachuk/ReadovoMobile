/**
 * Parses JSON successes strictly and preserves non-JSON HTTP error bodies.
 * @param data - Adapter response data.
 * @param status - HTTP status used to distinguish domain errors from invalid successes.
 * @returns Parsed JSON, empty data for 204, or unparsed error text.
 * @example parseHttpData('{"id":1}', 200); // => { id: 1 }
 */
export function parseHttpData(data: unknown, status: number): unknown {
  if (typeof data !== 'string' || status === 204) return data;
  try {
    return JSON.parse(data);
  } catch (error) {
    if (status >= 200 && status < 300) throw error;
    return data;
  }
}
