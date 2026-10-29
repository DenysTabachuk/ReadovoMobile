import { type ApiErrorDefinition } from '../common/errors/api-error-definition';
import { MAX_DICTIONARY_FRAGMENT_WORDS } from './constants';

/** Dictionary owns its word, test-generation and embedding error definitions. */
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
  TEST_NO_WORDS: {
    code: 'DICTIONARY_TEST_NO_WORDS',
    statusCode: 400,
    message: 'At least 1 dictionary word is required to create a test.',
  },
  TEST_NO_REVIEW_CANDIDATES: {
    code: 'DICTIONARY_TEST_NO_REVIEW_CANDIDATES',
    statusCode: 400,
    message: 'No dictionary words are available to create a test.',
  },
  TEST_GENERATION_FAILED: {
    code: 'DICTIONARY_TEST_GENERATION_FAILED',
    statusCode: 502,
    message: 'Failed to generate dictionary test.',
  },
  TEST_GENERATION_EMPTY: {
    code: 'DICTIONARY_TEST_GENERATION_EMPTY',
    statusCode: 502,
    message: 'Dictionary test generation was empty.',
  },
  TEST_GENERATION_INVALID_RESPONSE: {
    code: 'DICTIONARY_TEST_GENERATION_INVALID_RESPONSE',
    statusCode: 502,
    message: 'Dictionary test generation returned invalid JSON.',
  },
  TEST_GENERATION_INCOMPLETE: {
    code: 'DICTIONARY_TEST_GENERATION_INCOMPLETE',
    statusCode: 502,
    message: 'Dictionary test generation returned incomplete questions.',
  },
  EMBEDDINGS_INVALID: {
    code: 'DICTIONARY_EMBEDDINGS_INVALID',
    statusCode: 400,
    message: 'Embeddings must be non-empty arrays of the same length.',
  },
  QUIZ_DISTRACTORS_INSUFFICIENT: {
    code: 'DICTIONARY_QUIZ_DISTRACTORS_INSUFFICIENT',
    statusCode: 400,
    message: 'At least 3 distractor words are required.',
  },
} as const satisfies Record<string, ApiErrorDefinition>;
