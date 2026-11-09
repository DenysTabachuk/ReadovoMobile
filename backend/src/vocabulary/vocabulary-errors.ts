import type { ApiErrorDefinition } from '../common/errors/api-error-definition';

export const VOCABULARY_ERRORS = {
  LESSON_NOT_FOUND: {
    code: 'VOCABULARY_LESSON_NOT_FOUND',
    statusCode: 404,
    message: 'Vocabulary lesson not found.',
  },
} as const satisfies Record<string, ApiErrorDefinition>;
