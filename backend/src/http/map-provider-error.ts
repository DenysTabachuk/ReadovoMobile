import { type HttpException } from '@nestjs/common';

import { ExternalHttpError } from './external-http.error';

/** Maps provider HTTP rejection to the endpoint's existing public exception. */
export function mapProviderError(exception: HttpException) {
  return (error: unknown): never => {
    if (error instanceof ExternalHttpError) throw exception;
    throw error;
  };
}
