import { type ResultTier } from '../../../../types';

import type { createStyles } from '../../styles';

type RingStyles = Pick<
  ReturnType<typeof createStyles>,
  'goodRing' | 'normalRing' | 'poorRing'
>;

/**
 * Select the score ring from the caller's resolved appearance styles.
 * @param tier - Result tier deciding the feedback state.
 * @param styles - Ring styles already resolved from the application palette.
 * @returns The selected style reference without mutating the supplied styles.
 * @example
 * resolveTierRingStyle('good', { goodRing: { borderColor: 'green' }, normalRing: {}, poorRing: {} });
 * // => { borderColor: 'green' }
 */
export function resolveTierRingStyle(tier: ResultTier, styles: RingStyles) {
  if (tier === 'good') {
    return styles.goodRing;
  }

  if (tier === 'normal') {
    return styles.normalRing;
  }

  return styles.poorRing;
}
