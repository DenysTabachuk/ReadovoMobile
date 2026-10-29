import { HttpException } from '@nestjs/common';

import { type ValidationRule } from '../validation/create-validation-exception';
import { type ApiErrorDefinition } from './api-error-definition';

/** Identifies an invalid request field and its stable validation rule. */
export type ValidationField = {
  path: (string | number)[];
  rule: ValidationRule;
};

export type ValidationDetails = { fields: ValidationField[] };

// The definition's literal code determines whether field details are required.
type ExceptionDetails<Code extends string> = Code extends 'VALIDATION_FAILED'
  ? [details: ValidationDetails]
  : [];

/**
 * Creates an API error from a module-owned definition (code, status and message).
 * Validation errors also carry typed field details. The exception filter sends
 * the resulting response to the client; this class only constructs the error.
 *
 * @example
 * throw new ApiException(COMMON_ERRORS.REQUEST_TOO_LARGE);
 * // HTTP 413: {
 *              statusCode: 413,
 *              code: 'REQUEST_TOO_LARGE',
 *              message: 'Request body is too large.' }
 */
export class ApiException<Code extends string = string> extends HttpException {
  constructor(
    definition: ApiErrorDefinition<Code>,
    ...detailsArguments: ExceptionDetails<Code>
  ) {
    const [details] = detailsArguments;
    super(
      {
        statusCode: definition.statusCode,
        code: definition.code,
        message: definition.message,
        ...(details ? { details } : {}),
      },
      definition.statusCode,
    );
  }
}
