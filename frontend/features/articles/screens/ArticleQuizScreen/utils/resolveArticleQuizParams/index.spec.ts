import { resolveArticleQuizParams } from './index';

describe('resolveArticleQuizParams', () => {
  it('uses defaults and rejects missing and invalid article IDs', () => {
    expect(resolveArticleQuizParams({})).toEqual({
      articleId: null,
      quizLevel: 'A2',
      quizMode: 'article',
      quizTargetLength: 'medium',
      quizSessionTargetLength: 'medium',
    });
    expect(resolveArticleQuizParams({ id: '' }).articleId).toBeNull();
    expect(resolveArticleQuizParams({ id: '-1' }).articleId).toBeNull();
  });
  it('uses the first array value and preserves supported choices', () => {
    expect(
      resolveArticleQuizParams({
        id: ['42', '99'],
        level: ['B1'],
        mode: ['vocabulary'],
        targetLength: ['short'],
      }),
    ).toEqual({
      articleId: 42,
      quizLevel: 'B1',
      quizMode: 'vocabulary',
      quizTargetLength: 'short',
      quizSessionTargetLength: 'short',
    });
  });
  it('resolves original to the default session key without losing the reward option', () => {
    const params = resolveArticleQuizParams({
      id: '1',
      targetLength: 'original',
    });
    expect(params.quizTargetLength).toBe('original');
    expect(params.quizSessionTargetLength).toBe('medium');
  });
  it('falls back for unsupported choices and empty arrays', () => {
    const result = resolveArticleQuizParams({
      id: [],
      level: 'C1',
      mode: 'unknown',
      targetLength: [],
    });
    expect(result.quizLevel).toBe('A2');
    expect(result.quizMode).toBe('article');
    expect(result.quizTargetLength).toBe('medium');
  });
});
