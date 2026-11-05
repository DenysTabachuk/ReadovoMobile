import { palette } from '@/constants/palette';
import { withOpacity } from '@/utils/withOpacity';

// Score glows are decorative overlays, not independent feature themes.
export const scoreGlowColors = {
  good: {
    inner: withOpacity(palette.green500, 0.24),
    mid: withOpacity(palette.green500, 0.14),
    outer: withOpacity(palette.green500, 0.08),
  },
  normal: {
    inner: withOpacity(palette.yellow500, 0.24),
    mid: withOpacity(palette.yellow500, 0.14),
    outer: withOpacity(palette.yellow500, 0.08),
  },
  poor: {
    inner: withOpacity(palette.red500, 0.24),
    mid: withOpacity(palette.red500, 0.14),
    outer: withOpacity(palette.red500, 0.08),
  },
};
