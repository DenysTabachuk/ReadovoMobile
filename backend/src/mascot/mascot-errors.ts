import { type ApiErrorDefinition } from '../common/errors/api-error-definition';

/** Mascot owns these public codes, HTTP statuses and safe diagnostic messages. */
export const MASCOT_ERRORS = {
  ITEM_UNKNOWN: {
    code: 'MASCOT_ITEM_UNKNOWN',
    statusCode: 400,
    message: 'Unknown mascot item.',
  },
  NOT_ENOUGH_COINS: {
    code: 'MASCOT_NOT_ENOUGH_COINS',
    statusCode: 400,
    message: 'Not enough coins.',
  },
  ITEM_NOT_OWNED: {
    code: 'MASCOT_ITEM_NOT_OWNED',
    statusCode: 400,
    message: 'Mascot item is not owned.',
  },
  USER_NOT_FOUND: {
    code: 'MASCOT_USER_NOT_FOUND',
    statusCode: 404,
    message: 'User not found.',
  },
} as const satisfies Record<string, ApiErrorDefinition>;
