import { getArticleQuizSessionKey } from './index';

describe('getArticleQuizSessionKey', () => {
  it('includes the article and every generation setting in order', () => {
    expect(getArticleQuizSessionKey(42, 'vocabulary', 'A2', 'short')).toEqual([
      'articleQuizSession',
      42,
      'vocabulary',
      'A2',
      'short',
    ]);
  });
  it('retains unresolved article IDs and separates modes', () => {
    expect(getArticleQuizSessionKey(null, 'article', 'B2', 'long')).toEqual([
      'articleQuizSession',
      null,
      'article',
      'B2',
      'long',
    ]);
    expect(getArticleQuizSessionKey(42, 'article', 'A2', 'short')).not.toEqual(
      getArticleQuizSessionKey(42, 'vocabulary', 'A2', 'short'),
    );
  });
});
