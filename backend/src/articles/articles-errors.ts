import { type ApiErrorDefinition } from '../common/errors/api-error-definition';

export const ARTICLES_ERRORS = {
  SIMPLIFICATION_FAILED: {
    code: 'ARTICLES_SIMPLIFICATION_FAILED',
    statusCode: 502,
    message: 'Failed to simplify article.',
  },
  ADAPTATION_UNAVAILABLE: {
    code: 'ARTICLES_ADAPTATION_UNAVAILABLE',
    statusCode: 502,
    message: 'Article adaptation is unavailable.',
  },
  SUMMARY_UNAVAILABLE: {
    code: 'ARTICLES_SUMMARY_UNAVAILABLE',
    statusCode: 502,
    message: 'Article summary is unavailable.',
  },
  WIKIPEDIA_REQUEST_FAILED: {
    code: 'ARTICLES_WIKIPEDIA_REQUEST_FAILED',
    statusCode: 502,
    message: 'Failed to fetch Wikipedia content.',
  },
  WIKIPEDIA_HTML_REQUEST_FAILED: {
    code: 'ARTICLES_WIKIPEDIA_HTML_REQUEST_FAILED',
    statusCode: 502,
    message: 'Failed to fetch Wikipedia article HTML.',
  },
  WIKIPEDIA_ARTICLE_UNAVAILABLE: {
    code: 'ARTICLES_WIKIPEDIA_ARTICLE_UNAVAILABLE',
    statusCode: 502,
    message: 'Wikipedia article is unavailable.',
  },
  WIKIPEDIA_CONTENT_UNAVAILABLE: {
    code: 'ARTICLES_WIKIPEDIA_CONTENT_UNAVAILABLE',
    statusCode: 502,
    message: 'Wikipedia article content is unavailable.',
  },
  WIKIPEDIA_INVALID_RESPONSE: {
    code: 'ARTICLES_WIKIPEDIA_INVALID_RESPONSE',
    statusCode: 502,
    message: 'Wikipedia response is invalid.',
  },
  USER_NOT_FOUND: {
    code: 'ARTICLES_USER_NOT_FOUND',
    statusCode: 404,
    message: 'User not found.',
  },
} as const satisfies Record<string, ApiErrorDefinition>;
