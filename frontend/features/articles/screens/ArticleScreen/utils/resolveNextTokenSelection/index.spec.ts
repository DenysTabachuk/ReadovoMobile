import { resolveNextTokenSelection } from './index';

type Token = Parameters<typeof resolveNextTokenSelection>[1];
const first: Token = {
  context: 'One two three four five six.',
  text: 'two',
  word: 'two',
  tokenKey: 'w1',
  sentenceKey: 's0',
  sentenceWordIndex: 1,
};
describe('resolveNextTokenSelection', () => {
  it('starts a selection and extends it at either adjacent end without mutation', () => {
    expect(resolveNextTokenSelection([], first)).toEqual([first]);
    const input = [first];
    const after = { ...first, tokenKey: 'w2', sentenceWordIndex: 2 };
    const before = { ...first, tokenKey: 'w0', sentenceWordIndex: 0 };
    expect(resolveNextTokenSelection(input, after)).toEqual([first, after]);
    expect(resolveNextTokenSelection(input, before)).toEqual([first, before]);
    expect(input).toEqual([first]);
  });
  it('restarts selection for another sentence, a gap, or missing position data', () => {
    for (const token of [
      { ...first, sentenceKey: 's1' },
      { ...first, tokenKey: 'w5', sentenceWordIndex: 5 },
      { ...first, tokenKey: 'unknown', sentenceWordIndex: undefined },
    ]) {
      expect(resolveNextTokenSelection([first], token)).toEqual([token]);
    }
  });
  it('retains the same array for a duplicate word or the five-word limit', () => {
    const input = [first];
    expect(resolveNextTokenSelection(input, first)).toBe(input);
    const full = [0, 1, 2, 3, 4].map((index) => ({
      ...first,
      tokenKey: `w${index}`,
      sentenceWordIndex: index,
    }));
    expect(
      resolveNextTokenSelection(full, {
        ...first,
        tokenKey: 'w5',
        sentenceWordIndex: 5,
      }),
    ).toBe(full);
  });
});
