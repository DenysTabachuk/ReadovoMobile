import { getGlobalWordIndex } from './index';

const word = { charStart: 0, charEnd: 1, text: 'a', tokenKey: 'a' };
const chunks = [
  { text: 'a a', words: [word, word] },
  { text: 'a a a', words: [word, word, word] },
];

describe('getGlobalWordIndex', () => {
  it('counts preceding words and keeps the current chunk offset', () => {
    expect(getGlobalWordIndex(chunks, 0, 1)).toBe(1);
    expect(getGlobalWordIndex(chunks, 1, 2)).toBe(4);
    expect(getGlobalWordIndex(chunks, 2, 0)).toBe(5);
    expect(chunks[0].words).toHaveLength(2);
  });
  it('handles no preceding chunks', () => {
    expect(getGlobalWordIndex([], 0, 0)).toBe(0);
  });
});
