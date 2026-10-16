import { countWords } from './index';

describe('countWords', () => {
  it.each([
    ['', 0],
    [' \n\t ', 0],
    ['hello', 1],
    ['take   off', 2],
    ['mother-in-law', 1],
    ['two\nwords', 2],
  ])('counts %j', (text, expected) => {
    expect(countWords(text)).toBe(expected);
  });
});
