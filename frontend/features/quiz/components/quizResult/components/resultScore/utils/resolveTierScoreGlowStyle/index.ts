import { type ResultTier } from '../../../../types';

import { styles } from '../../styles';

export function resolveTierScoreGlowStyle(tier: ResultTier): {
  inner: object;
  mid: object;
  outer: object;
} {
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
