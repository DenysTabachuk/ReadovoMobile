import { type AxiosResponse } from 'axios';

type ErrorResponse = Pick<AxiosResponse<unknown>, 'status' | 'data'>;

/** HTTP failure without Axios request configuration or credentials. */
export class HttpError extends Error {
  readonly status: number;
  #response: ErrorResponse;

  constructor(response: ErrorResponse) {
    super('HTTP request failed.');
    this.name = 'HttpError';
    this.status = response.status;
    this.#response = { status: response.status, data: response.data };
  }

  get response(): ErrorResponse {
    return this.#response;
  }
}
