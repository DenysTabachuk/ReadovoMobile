import { isSpeakingTokenChangeIrrelevant } from './index';

describe('isSpeakingTokenChangeIrrelevant', () => {
  it.each([
    [undefined, undefined, true],
    ['block-2-w0', 'block-3-w0', true],
    ['block-1-w0', 'block-1-w0', true],
    [undefined, 'block-1-w0', false],
    ['block-1-w0', undefined, false],
    ['block-1-w0', 'block-1-w1', false],
    ['block-10-w0', 'block-2-w0', true],
  ])('compares %j to %j', (previous, next, expected) => {
    expect(
      isSpeakingTokenChangeIrrelevant({
        prefix: 'block-1',
        previousSpeakingTokenKey: previous,
        nextSpeakingTokenKey: next,
      }),
    ).toBe(expected);
  });
});
