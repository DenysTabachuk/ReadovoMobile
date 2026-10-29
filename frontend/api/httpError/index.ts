import { type AxiosResponse } from 'axios';

type ErrorResponse = Pick<AxiosResponse<unknown>, 'status' | 'data'>;

/**
 * HTTP failure without Axios request configuration or credentials.
 * @param response - HTTP status and response body; only a string code is extracted.
 * Unknown string codes are retained for feature-owned handling. Missing/non-string
 * codes stay undefined. The backend message never becomes Error.message.
 * @example
 * const error = new HttpError({ status: 400, data: { code: 'MASCOT_NOT_ENOUGH_COINS' } });
 * // error.status === 400; error.code === 'MASCOT_NOT_ENOUGH_COINS'.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly code?: string;
  #response: ErrorResponse;

  constructor(response: ErrorResponse) {
    super('HTTP request failed.');
    this.name = 'HttpError';
    this.status = response.status;
    const data = response.data;
    if (
      typeof data === 'object' &&
      data !== null &&
      !Array.isArray(data) &&
      'code' in data &&
      typeof data.code === 'string'
    ) {
      this.code = data.code;
    }
    this.#response = { status: response.status, data: response.data };
  }

  get response(): ErrorResponse {
    return this.#response;
  }
}
