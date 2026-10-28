import {
  type ApiErrorDefinition,
  type ApiErrorTemplate,
} from './api-error-definition';

/** Errors owned by shared request parsing, validation, routing and serialization. */
export const COMMON_ERRORS = {
  VALIDATION_FAILED: {
    code: 'VALIDATION_FAILED',
    statusCode: 400,
    message: 'Request validation failed.',
  },
  REQUEST_MALFORMED: {
    code: 'REQUEST_MALFORMED',
    statusCode: 400,
    message: 'Malformed request body.',
  },
  REQUEST_TOO_LARGE: {
    code: 'REQUEST_TOO_LARGE',
    statusCode: 413,
    message: 'Request body is too large.',
  },
  ROUTE_NOT_FOUND: {
    code: 'ROUTE_NOT_FOUND',
    statusCode: 404,
    message: 'Route not found.',
  },
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    statusCode: 500,
    message: 'Internal server error.',
  },
  // This fallback preserves the original HTTP status instead of defining one.
  REQUEST_REJECTED: {
    code: 'REQUEST_REJECTED',
    message: 'Request rejected.',
  },
} as const satisfies Record<string, ApiErrorDefinition | ApiErrorTemplate>;
