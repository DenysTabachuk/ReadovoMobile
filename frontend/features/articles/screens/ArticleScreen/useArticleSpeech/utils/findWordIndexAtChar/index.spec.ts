import { findWordIndexAtChar } from './index';

const words = [
  { charStart: 0, charEnd: 2, text: 'Hi', tokenKey: 'w0' },
  { charStart: 3, charEnd: 6, text: 'all', tokenKey: 'w1' },
];

describe('findWordIndexAtChar', () => {
  it.each([
    [0, 0],
    [1, 0],
    [2, 1],
    [3, 1],
    [6, 1],
    [20, 1],
    [-1, 0],
  ])('maps offset %i to word %i', (offset, expected) => {
    expect(findWordIndexAtChar(words, offset)).toBe(expected);
  });
  it('returns -1 when there are no words', () => {
    expect(findWordIndexAtChar([], 0)).toBe(-1);
  });
});
