import { getArticleQuizSessionKey } from '.';

it('separates saved quiz sessions by owner and generation settings', () => {
  const input = {
    userId: 'reader-a',
    articleId: 42,
    mode: 'vocabulary' as const,
    level: 'A2' as const,
    targetLength: 'short' as const,
  };
  expect(getArticleQuizSessionKey(input)).toEqual([
    'articleQuizSession',
    'reader-a',
    42,
    'vocabulary',
    'A2',
    'short',
  ]);
  expect(
    getArticleQuizSessionKey({ ...input, userId: 'reader-b' }),
  ).not.toEqual(getArticleQuizSessionKey(input));
  expect(getArticleQuizSessionKey({ ...input, mode: 'article' })).not.toEqual(
    getArticleQuizSessionKey(input),
  );
  expect(
    getArticleQuizSessionKey({ ...input, level: 'B2', targetLength: 'long' }),
  ).not.toEqual(getArticleQuizSessionKey(input));
  expect(
    getArticleQuizSessionKey({ ...input, articleId: null, userId: undefined }),
  ).toEqual([
    'articleQuizSession',
    undefined,
    null,
    'vocabulary',
    'A2',
    'short',
  ]);
});
