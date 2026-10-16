import { countSentences } from './index';

describe('countSentences', () => {
  it.each([
    ['', 0],
    [' \n\t ', 0],
    ['Hello world', 1],
    ['Hello! How are you?', 2],
    ['Really?! Yes...', 2],
    ['First.\nSecond!\tThird?', 3],
    ['The value is 3.14.', 1],
    ['  One sentence.  ', 1],
  ])('counts sentence-ending groups in %j', (text, expected) => {
    expect(countSentences(text)).toBe(expected);
  });
});
