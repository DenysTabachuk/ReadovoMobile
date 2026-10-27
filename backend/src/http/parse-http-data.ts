import {
  type AxiosRequestConfig,
  type AxiosResponseHeaders,
  type RawAxiosResponseHeaders,
} from 'axios';

/** Preserves text endpoints and error bodies; malformed successful JSON rejects. */
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
