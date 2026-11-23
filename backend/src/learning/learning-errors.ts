import type { ApiErrorDefinition } from '../common/errors/api-error-definition';

export const LEARNING_ERRORS = {
  NOT_FOUND: {
    code: 'LEARNING_CONTENT_NOT_FOUND',
    statusCode: 404,
    message: 'Learning content not found.',
  },
  OPTION_NOT_AVAILABLE: {
    code: 'LEARNING_OPTION_NOT_AVAILABLE',
    statusCode: 400,
    message: 'Option is not available for this question.',
  },
} as const satisfies Record<string, ApiErrorDefinition>;
