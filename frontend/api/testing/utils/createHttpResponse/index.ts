import { AxiosHeaders, type AxiosResponse } from 'axios';

type ResponseOptions = { status?: number };

/** Builds a parsed Axios response fixture without performing HTTP.
 * @param data - JSON data or a serialized fixture body.
 * @param options - Optional HTTP status (defaults to 200).
 * @returns A response accepted by the real Axios pipeline.
 * @example createHttpResponse({ id: 1 }).data; // => { id: 1 }
 */
export function createHttpResponse(
  data: unknown = '',
  options: ResponseOptions = {},
): AxiosResponse<unknown> {
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      /* Preserve text fixtures. */
    }
  }
  return {
    data,
    status: options.status ?? 200,
    statusText: '',
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
}
