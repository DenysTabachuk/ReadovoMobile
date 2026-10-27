import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

import { API_BASE_URL } from '../../config';
import { HttpError } from '../../httpError';
import { parseHttpData } from '../parseHttpData';

/** Creates a configured Axios instance, installing feature interceptors before error sanitization.
 * @param configure - Optional one-time interceptor registration for the new instance.
 * @returns A standalone Axios instance with strict JSON and safe rejection handling.
 * @example const client = createHttpClient(); await client.get('/articles');
 */
export function createHttpClient(configure?: (client: AxiosInstance) => void) {
  const client = axios.create({
    baseURL: API_BASE_URL,
    responseType: 'json',
    transitional: { silentJSONParsing: false },
    transformResponse: [
      function (this: AxiosRequestConfig, data: unknown, _headers, status) {
        return this.responseType === 'text'
          ? data
          : parseHttpData(data, status ?? 0);
      },
    ],
    withXSRFToken: false,
  });

  configure?.(client);

  client.interceptors.response.use(undefined, (error: unknown) => {
    if (axios.isCancel(error)) {
      const aborted = new Error('Request cancelled.');
      aborted.name = 'AbortError';
      return Promise.reject(aborted);
    }
    if (axios.isAxiosError(error)) {
      if (error.response) return Promise.reject(new HttpError(error.response));
      const failure = new Error(
        error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
          ? 'HTTP request timed out.'
          : 'HTTP request failed.',
      );
      failure.name =
        error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
          ? 'TimeoutError'
          : 'NetworkError';
      // Do not let Axios config (tokens, passwords, payloads) reach UI logs.
      return Promise.reject(failure);
    }
    return Promise.reject(error);
  });
  return client;
}
