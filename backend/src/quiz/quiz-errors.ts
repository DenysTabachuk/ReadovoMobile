import type { ApiErrorDefinition } from '../common/errors/api-error-definition';

export const QUIZ_ERRORS = {
  SESSION_NOT_FOUND: {
    code: 'QUIZ_SESSION_NOT_FOUND',
    statusCode: 404,
    message: 'Quiz session not found.',
  },
  ANSWER_INVALID: {
    code: 'QUIZ_ANSWER_INVALID',
    statusCode: 400,
    message: 'Invalid question or answer selection.',
  },
  ANSWER_ALREADY_SUBMITTED: {
    code: 'QUIZ_ANSWER_ALREADY_SUBMITTED',
    statusCode: 409,
    message: 'This question already has a different answer.',
  },
  SESSION_INCOMPLETE: {
    code: 'QUIZ_SESSION_INCOMPLETE',
    statusCode: 409,
    message: 'Answer all questions before completing the quiz.',
  },
  SESSION_COMPLETED: {
    code: 'QUIZ_SESSION_COMPLETED',
    statusCode: 409,
    message: 'This quiz is already completed.',
  },
} as const satisfies Record<string, ApiErrorDefinition>;
