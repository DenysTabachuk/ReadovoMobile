import { getContextSentence } from './index';

describe('getContextSentence', () => {
  it('finds the full sentence for a selection at a word boundary', () => {
    expect(getContextSentence('Hello world. Bye.', 6, 11)).toBe('Hello world.');
    expect(getContextSentence('Hello world. Bye.', 13, 16)).toBe('Bye.');
  });
  it('rejects a selection spanning sentences or outside the source', () => {
    expect(getContextSentence('Hello. Bye.', 0, 10)).toBe('');
    expect(getContextSentence('Hello.', 20, 21)).toBe('');
    expect(getContextSentence('', 0, 0)).toBe('');
  });
});
