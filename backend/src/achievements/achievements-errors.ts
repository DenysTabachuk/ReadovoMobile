import { type ApiErrorDefinition } from '../common/errors/api-error-definition';

/** Achievements owns its public domain error definitions. */
export const ACHIEVEMENTS_ERRORS = {
  USER_NOT_FOUND: {
    code: 'ACHIEVEMENTS_USER_NOT_FOUND',
    statusCode: 404,
    message: 'User not found.',
  },
} as const satisfies Record<string, ApiErrorDefinition>;
