import { isVocabularyWordQuestion } from './index';

describe('isVocabularyWordQuestion', () => {
  it('accepts vocabulary fields with or without an excerpt', () => {
    expect(
      isVocabularyWordQuestion({ id: 'q1', term: 'sun', translation: 'sol' }),
    ).toBe(true);
    expect(
      isVocabularyWordQuestion({
        id: 'q1',
        term: 'sun',
        translation: 'sol',
        sourceExcerpt: '',
      }),
    ).toBe(true);
  });
  it.each([
    null,
    undefined,
    'sun',
    {},
    { id: 'q1', term: 'sun' },
    { id: 'q1', term: '', translation: 'sol' },
    { id: 'q1', term: 1, translation: 'sol' },
    { id: 'q1', term: 'sun', translation: 'sol', sourceExcerpt: 1 },
  ])('rejects unusable input %p', (value) => {
    expect(isVocabularyWordQuestion(value)).toBe(false);
  });
});
