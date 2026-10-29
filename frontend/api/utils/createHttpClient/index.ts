import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

import { API_BASE_URL } from '../../config';
import { HttpError } from '../../httpError';
import { parseHttpData } from '../parseHttpData';

/** Creates a configured Axios instance, installing feature interceptors before error sanitization.
 * In development, logs request destinations and outcomes without headers, bodies or queries.
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

  client.interceptors.request.use((config) => {
    logRequest(config, 'request');
    return config;
  });
  client.interceptors.response.use(
    (response) => {
      logRequest(response.config, `response ${response.status}`);
      return response;
    },
    (error: unknown) => {
      if (axios.isAxiosError(error)) {
        logRequest(
          error.config,
          axios.isCancel(error)
            ? 'cancelled'
            : `failed ${error.response?.status ?? 'no response'}`,
        );
      }
      return Promise.reject(error);
    },
  );

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

// Never log raw Axios config or URLs: they can contain credentials and query tokens.
function logRequest(config: AxiosRequestConfig | undefined, outcome: string) {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;

  let destination = '(unknown destination)';
  try {
    const url = new URL(config?.url ?? '', config?.baseURL ?? API_BASE_URL);
    destination = `${url.origin}${url.pathname}`;
  } catch {
    // Keep malformed URLs out of logs as well.
  }
  console.info(
    `[API] ${outcome} ${(config?.method ?? 'get').toUpperCase()} ${destination}`,
  );
}
