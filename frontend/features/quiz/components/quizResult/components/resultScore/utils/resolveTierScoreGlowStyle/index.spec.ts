import { resolveTierScoreGlowStyle } from '.';

describe('resolveTierScoreGlowStyle', () => {
  it.each(['good', 'normal', 'poor'] as const)(
    'selects all three caller-owned %s glow layers',
    (tier) => {
      const styles = {
        scoreGlowGoodInner: { backgroundColor: 'good-inner' },
        scoreGlowGoodMid: { backgroundColor: 'good-mid' },
        scoreGlowGoodOuter: { backgroundColor: 'good-outer' },
        scoreGlowNormalInner: { backgroundColor: 'normal-inner' },
        scoreGlowNormalMid: { backgroundColor: 'normal-mid' },
        scoreGlowNormalOuter: { backgroundColor: 'normal-outer' },
        scoreGlowPoorInner: { backgroundColor: 'poor-inner' },
        scoreGlowPoorMid: { backgroundColor: 'poor-mid' },
        scoreGlowPoorOuter: { backgroundColor: 'poor-outer' },
      };
      const selected = resolveTierScoreGlowStyle(tier, styles);
      expect(selected).toEqual({
        inner: { backgroundColor: `${tier}-inner` },
        mid: { backgroundColor: `${tier}-mid` },
        outer: { backgroundColor: `${tier}-outer` },
      });
      expect(Object.values(styles)).toContain(selected.inner);
      expect(Object.values(styles)).toContain(selected.mid);
      expect(Object.values(styles)).toContain(selected.outer);
    },
  );
});
