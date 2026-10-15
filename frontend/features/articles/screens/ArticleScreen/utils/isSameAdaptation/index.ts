import type {
  ArticleAdaptationSummary,
  SimplifyArticleLevel,
  ArticleTextTransformationType,
} from '@/features/articles/api/wikipedia';

export function isSameAdaptation(
  adaptation: ArticleAdaptationSummary,
  level: SimplifyArticleLevel,
  transformationType: ArticleTextTransformationType,
): boolean {
  return (
    adaptation.level === level &&
    adaptation.transformationType === transformationType
  );
}
