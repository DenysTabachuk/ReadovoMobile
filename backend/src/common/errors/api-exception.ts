import { HttpException } from '@nestjs/common';

import { type ValidationRule } from '../validation/create-validation-exception';

/** Maps each application error code to its HTTP status and safe diagnostic message. */
export const API_ERRORS = {
  VALIDATION_FAILED: { statusCode: 400, message: 'Request validation failed.' },
  REQUEST_MALFORMED: { statusCode: 400, message: 'Malformed request body.' },
  REQUEST_TOO_LARGE: { statusCode: 413, message: 'Request body is too large.' },
  ROUTE_NOT_FOUND: { statusCode: 404, message: 'Route not found.' },
  INTERNAL_ERROR: { statusCode: 500, message: 'Internal server error.' },
} as const;

/** Identifies an invalid request field and its stable validation rule. */
export type ValidationField = {
  path: (string | number)[];
  rule: ValidationRule;
};

export type ValidationDetails = { fields: ValidationField[] };

type ApiErrorCode = keyof typeof API_ERRORS;
// Validation errors require field details; all other errors accept only a code.
type ApiExceptionArguments =
  | [code: Exclude<ApiErrorCode, 'VALIDATION_FAILED'>]
  | [code: 'VALIDATION_FAILED', details: ValidationDetails];

/**
 * Creates an API error from a code so callers do not repeat statuses and messages.
 * Validation errors also carry typed field details. The exception filter sends
 * the resulting response to the client; this class only constructs the error.
 *
 * @example
 * throw new ApiException('REQUEST_TOO_LARGE');
 * // HTTP 413: {
 *              statusCode: 413,
 *              code: 'REQUEST_TOO_LARGE',
 *              message: 'Request body is too large.' }
 */
export class ApiException extends HttpException {
  constructor(...args: ApiExceptionArguments) {
    const [code, details] = args;
    const definition = API_ERRORS[code];
    super(
      { ...definition, code, ...(details ? { details } : {}) },
      definition.statusCode,
    );
  }
}
