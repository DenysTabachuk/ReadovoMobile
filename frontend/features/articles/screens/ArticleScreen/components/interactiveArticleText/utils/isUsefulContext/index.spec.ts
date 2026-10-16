import { isUsefulContext } from './index';

describe('isUsefulContext', () => {
  it('matches the word case-insensitively at the minimum context length', () => {
    expect(isUsefulContext('word' + ' '.repeat(20), 'WORD')).toBe(true);
    expect(isUsefulContext('word' + ' '.repeat(19), 'word')).toBe(false);
  });
  it('rejects missing words, empty text, and incomplete parenthetical context', () => {
    expect(isUsefulContext('', 'word')).toBe(false);
    expect(
      isUsefulContext('The quick brown fox jumps over the dog.', 'cat'),
    ).toBe(false);
    expect(
      isUsefulContext('The quick brown (fox jumps over the dog.', 'fox'),
    ).toBe(false);
  });
  it('accepts balanced nested parentheses', () => {
    expect(
      isUsefulContext('The (quick (brown) fox) jumps over the dog.', 'fox'),
    ).toBe(true);
  });
});
