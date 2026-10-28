import { type ApiErrorDefinition } from '../common/errors/api-error-definition';

export const ARTICLES_ERRORS = {
  USER_NOT_FOUND: {
    code: 'ARTICLES_USER_NOT_FOUND',
    statusCode: 404,
    message: 'User not found.',
  },
} as const satisfies Record<string, ApiErrorDefinition>;
