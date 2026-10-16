import { resolveEffectiveTargetLength } from './index';

describe('resolveEffectiveTargetLength', () => {
  it.each(['short', 'medium', 'long'] as const)(
    'preserves explicit %s even for empty text',
    (length) => {
      expect(resolveEffectiveTargetLength(length, '')).toBe(length);
    },
  );
  it.each([
    [0, 'short'],
    [5, 'short'],
    [6, 'medium'],
    [10, 'medium'],
    [11, 'long'],
  ])('classifies %i sentences', (count, expected) => {
    expect(
      resolveEffectiveTargetLength(
        'original',
        'A full sentence. '.repeat(count),
      ),
    ).toBe(expected);
  });
});
