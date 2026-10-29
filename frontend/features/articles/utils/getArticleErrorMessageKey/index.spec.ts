import { HttpError } from '@/api/httpError';
import { getArticleErrorMessageKey } from '.';

it.each([
  ['ARTICLES_WIKIPEDIA_ARTICLE_UNAVAILABLE', 'article.unavailable'],
  ['ARTICLES_WIKIPEDIA_CONTENT_UNAVAILABLE', 'article.contentUnavailable'],
  ['ARTICLES_QUIZ_GENERATION_FAILED', 'article.quiz.error'],
  ['ARTICLES_VOCABULARY_QUIZ_GENERATION_FAILED', 'article.quiz.error'],
  ['ARTICLES_ADAPTATION_UNAVAILABLE', 'article.adaptError'],
  ['ARTICLES_SUMMARY_UNAVAILABLE', 'article.summaryError'],
])('resolves %s independently of message wording', (code, key) => {
  expect(
    getArticleErrorMessageKey(
      new HttpError({ status: 502, data: { code, message: 'private' } }),
    ),
  ).toBe(key);
  expect(
    getArticleErrorMessageKey(new HttpError({ status: 400, data: { code } })),
  ).toBe('errors.generic');
});
it('keeps unknown failures generic and cancellation silent', () => {
  expect(getArticleErrorMessageKey(new Error('private'))).toBe(
    'errors.generic',
  );
  expect(
    getArticleErrorMessageKey(
      Object.assign(new Error(), { name: 'AbortError' }),
    ),
  ).toBeNull();
});
