import { resolveTierRingStyle } from '.';

describe('resolveTierRingStyle', () => {
  it.each([
    ['good', 'goodRing', 'success'],
    ['normal', 'normalRing', 'warning'],
    ['poor', 'poorRing', 'danger'],
  ] as const)('selects the caller-owned %s ring', (tier, key, expected) => {
    const styles = {
      goodRing: { borderColor: 'success' },
      normalRing: { borderColor: 'warning' },
      poorRing: { borderColor: 'danger' },
    };
    expect(resolveTierRingStyle(tier, styles)).toEqual({
      borderColor: expected,
    });
    expect(resolveTierRingStyle(tier, styles)).toBe(styles[key]);
  });
});
