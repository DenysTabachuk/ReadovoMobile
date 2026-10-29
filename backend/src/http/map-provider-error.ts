import { type HttpException } from '@nestjs/common';

import { ExternalHttpError } from './external-http.error';

/**
 * Creates a rejection handler that replaces provider HTTP failures only.
 * @param exception - Public exception to throw for any ExternalHttpError.
 * @returns A callback accepting an unknown rejection reason. It throws the supplied
 * exception for ExternalHttpError and rethrows every other reason unchanged;
 * it never returns normally or mutates either input.
 * @example
 * const unavailable = new BadGatewayException('Provider unavailable.');
 * const handleRejection = mapProviderError(unavailable);
 * handleRejection(new ExternalHttpError(503)); // throws the same unavailable instance
 * // handleRejection(new SyntaxError('Invalid JSON')) rethrows that SyntaxError unchanged.
 */
export function mapProviderError(exception: HttpException) {
  return (error: unknown): never => {
    if (error instanceof ExternalHttpError) throw exception;
    throw error;
  };
}
