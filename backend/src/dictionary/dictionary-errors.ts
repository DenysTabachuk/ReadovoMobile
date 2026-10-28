import { type ApiErrorDefinition } from '../common/errors/api-error-definition';
import { MAX_DICTIONARY_FRAGMENT_WORDS } from './constants';

/** Word-operation errors; AI generation and embedding migration is still pending. */
export const DICTIONARY_ERRORS = {
  WORD_TOO_LONG: {
    code: 'DICTIONARY_WORD_TOO_LONG',
    statusCode: 400,
    message: `Word or phrase must contain at most ${MAX_DICTIONARY_FRAGMENT_WORDS} words.`,
  },
  WORD_ALREADY_EXISTS: {
    code: 'DICTIONARY_WORD_ALREADY_EXISTS',
    statusCode: 400,
    message: 'Word or phrase already exists in dictionary.',
  },
  WORD_NOT_FOUND: {
    code: 'DICTIONARY_WORD_NOT_FOUND',
    statusCode: 404,
    message: 'Dictionary word was not found.',
  },
} as const satisfies Record<string, ApiErrorDefinition>;
