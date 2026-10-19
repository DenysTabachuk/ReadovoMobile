import { isSelectedTokensChangeIrrelevant } from './index';

describe('isSelectedTokensChangeIrrelevant', () => {
  it.each([
    [undefined, undefined, true],
    [['block-2-w0'], ['block-3-w0'], true],
    [['block-1-w0'], ['block-1-w0', 'block-2-w0'], true],
    [[], ['block-1-w0'], false],
    [['block-1-w0'], [], false],
    [['block-1-w0', 'block-1-w1'], ['block-1-w1', 'block-1-w0'], false],
    [['block-1-w0'], ['block-1-w1'], false],
  ])('compares selections %j and %j', (previous, next, expected) => {
    expect(
      isSelectedTokensChangeIrrelevant({
        prefix: 'block-1',
        previousSelectedTokenKeys: previous,
        nextSelectedTokenKeys: next,
      }),
    ).toBe(expected);
  });
});
