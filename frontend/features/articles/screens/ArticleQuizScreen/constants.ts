import {
  type SimplifyArticleLevel,
  type SimplifyArticleTargetLength,
} from '@/features/articles/api/wikipedia';

export const DEFAULT_LEVEL: SimplifyArticleLevel = 'A2';
export const DEFAULT_LENGTH: SimplifyArticleTargetLength = 'medium';
export const TARGET_LENGTH_MAX_SENTENCES: Record<
  SimplifyArticleTargetLength,
  number
> = {
  short: 5,
  medium: 10,
  long: 16,
};
