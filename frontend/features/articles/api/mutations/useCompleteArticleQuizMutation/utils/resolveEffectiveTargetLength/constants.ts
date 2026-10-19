import type { SimplifyArticleTargetLength } from '../../../../types';
export const TARGET_LENGTH_MAX_SENTENCES: Record<
  SimplifyArticleTargetLength,
  number
> = {
  short: 5,
  medium: 10,
  long: 16,
};
