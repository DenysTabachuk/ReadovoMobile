import type {
  ArticleAdaptationSummary,
  SimplifyArticleLevel,
  ArticleTextTransformationType,
} from '@/features/articles/api/wikipedia';

/**
 * Check whether an available text variant matches the requested settings.
 *
 * @param adaptation - Available variant metadata.
 * @param level - Requested language level.
 * @param transformationType - Requested adaptation or summary mode.
 * @returns True only when both level and transformation type match.
 * @example
 * isSameAdaptation({ level: 'A2', transformationType: 'summary' }, 'A2', 'summary');
 * // => true
 */
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
