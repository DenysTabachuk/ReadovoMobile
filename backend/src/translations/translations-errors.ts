import { type ApiErrorDefinition } from '../common/errors/api-error-definition';

export const TRANSLATIONS_ERRORS = {
  REQUEST_FAILED: {
    code: 'TRANSLATIONS_REQUEST_FAILED',
    statusCode: 502,
    message: 'Failed to fetch translation.',
  },
  UNAVAILABLE: {
    code: 'TRANSLATIONS_UNAVAILABLE',
    statusCode: 502,
    message: 'Translation is unavailable.',
  },
} as const satisfies Record<string, ApiErrorDefinition>;
