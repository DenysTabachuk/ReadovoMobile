import { type ResultTier } from '../../../../types';

import { styles } from '../../styles';

export function resolveTierRingStyle(tier: ResultTier) {
  if (tier === 'good') {
    return styles.goodRing;
  }

  if (tier === 'normal') {
    return styles.normalRing;
  }

  return styles.poorRing;
}
