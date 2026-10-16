import type {
  SimplifyArticleLevel,
  ArticleTextTransformationType,
} from '@/features/articles/api/wikipedia';

/**
 * Identify a generated text variant by transformation type and language level.
 *
 * @param level - Requested language level.
 * @param transformationType - Adaptation or summary mode.
 * @returns A transformationType:level key for indexing generated variants.
 * @example
 * createAdaptationKey('A2', 'summary');
 * // => 'summary:A2'
 */
export function createAdaptationKey(
  level: SimplifyArticleLevel,
  transformationType: ArticleTextTransformationType,
): string {
  return `${transformationType}:${level}`;
}
