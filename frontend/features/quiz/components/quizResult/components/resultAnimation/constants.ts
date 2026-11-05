import { palette } from '@/constants/palette';
import { withOpacity } from '@/utils/withOpacity';

// Decorative glow layers share one hue; alpha controls their falloff over the backdrop.
export const resultGlowColors = {
  far: withOpacity(palette.purple500, 0.06),
  outer: withOpacity(palette.purple500, 0.1),
  mid: withOpacity(palette.purple500, 0.14),
  inner: withOpacity(palette.purple500, 0.18),
  core: withOpacity(palette.purple500, 0.16),
};
