import { type ResultTier } from '../../../../types';

import type { createStyles } from '../../styles';

type GlowStyles = Pick<
  ReturnType<typeof createStyles>,
  | 'scoreGlowGoodInner'
  | 'scoreGlowGoodMid'
  | 'scoreGlowGoodOuter'
  | 'scoreGlowNormalInner'
  | 'scoreGlowNormalMid'
  | 'scoreGlowNormalOuter'
  | 'scoreGlowPoorInner'
  | 'scoreGlowPoorMid'
  | 'scoreGlowPoorOuter'
>;

/**
 * Select decorative score-glow layers for a result tier.
 * @param tier - Result tier selecting the glow hue.
 * @param styles - Resolved layer styles; this utility reads no theme or native state.
 * @returns Inner, middle and outer references from the supplied styles, without mutation.
 * @example
 * // With good glow styles of { opacity: 0.24 }, { opacity: 0.14 }, { opacity: 0.08 }:
 * // resolveTierScoreGlowStyle('good', styles)
 * // => { inner: { opacity: 0.24 }, mid: { opacity: 0.14 }, outer: { opacity: 0.08 } }
 */
export function resolveTierScoreGlowStyle(
  tier: ResultTier,
  styles: GlowStyles,
) {
  if (tier === 'good') {
    return {
      inner: styles.scoreGlowGoodInner,
      mid: styles.scoreGlowGoodMid,
      outer: styles.scoreGlowGoodOuter,
    };
  }

  if (tier === 'normal') {
    return {
      inner: styles.scoreGlowNormalInner,
      mid: styles.scoreGlowNormalMid,
      outer: styles.scoreGlowNormalOuter,
    };
  }

  return {
    inner: styles.scoreGlowPoorInner,
    mid: styles.scoreGlowPoorMid,
    outer: styles.scoreGlowPoorOuter,
  };
}
