import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

import { type ApiErrorDefinition } from '../errors/api-error-definition';
import { COMMON_ERRORS } from '../errors/common-errors';
import { apiErrorResponses } from '../utils/apiErrorResponses';

type ApiErrorResponsesOptions = {
  errors?: readonly ApiErrorDefinition[];
  validation?: boolean;
};

// These boundaries are installed globally by configureApiBoundaries, including
// body parsing before route handlers. Routing 404s do not belong to an operation.
const COMMON_HTTP_ERRORS = [
  COMMON_ERRORS.REQUEST_MALFORMED,
  COMMON_ERRORS.REQUEST_TOO_LARGE,
  COMMON_ERRORS.INTERNAL_ERROR,
];

/**
 * Documents shared HTTP boundary errors and explicitly declared operation errors.
 * @param options - Operation-owned error definitions and whether DTO validation
 * can reject this request. Validation defaults to false; guards and service errors
 * are not inferred. Use with the production configureApiBoundaries setup.
 * @returns A method decorator adding Swagger metadata only. It does not catch
 * exceptions or change HTTP behavior; input definitions are not modified.
 * @example
 * @ApiErrorResponses({ validation: true, errors: [PROVIDER_ERRORS.UNAVAILABLE] })
 * // Documents shared parsing/internal errors, VALIDATION_FAILED, the provider
 * // error and the variable-status REQUEST_REJECTED fallback.
 */
export function ApiErrorResponses(
  options: ApiErrorResponsesOptions = {},
): MethodDecorator {
  const definitions: ApiErrorDefinition[] = [];
  if (options.validation) {
    definitions.push(COMMON_ERRORS.VALIDATION_FAILED);
  }
  definitions.push(...COMMON_HTTP_ERRORS, ...(options.errors ?? []));

  return applyDecorators(
    ...apiErrorResponses(definitions).map((response) => ApiResponse(response)),
  );
}
