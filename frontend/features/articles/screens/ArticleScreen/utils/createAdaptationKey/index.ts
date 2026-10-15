import type {
  SimplifyArticleLevel,
  ArticleTextTransformationType,
} from '@/features/articles/api/wikipedia';

export function createAdaptationKey(
  level: SimplifyArticleLevel,
  transformationType: ArticleTextTransformationType,
): string {
  return `${transformationType}:${level}`;
}
