import type { ArticleAdaptationSummary } from '@/features/articles/api';
import { createAdaptationKey } from '../createAdaptationKey';

/**
 * Merge persisted and session adaptations by transformation type and level.
 *
 * @param persisted - Adaptations reported by the server, in display order.
 * @param current - Session adaptations, which replace matching server entries.
 * @returns Unique adaptations in first-seen order without mutating either input.
 * @example
 * mergeArticleAdaptations([{ level: 'A2', transformationType: 'summary' }], []);
 * // => [{ level: 'A2', transformationType: 'summary' }]
 */
export function mergeArticleAdaptations(
  persisted: readonly ArticleAdaptationSummary[],
  current: readonly ArticleAdaptationSummary[],
): ArticleAdaptationSummary[] {
  const adaptations = new Map<string, ArticleAdaptationSummary>();
  for (const adaptation of [...persisted, ...current]) {
    adaptations.set(
      createAdaptationKey(adaptation.level, adaptation.transformationType),
      adaptation,
    );
  }
  return Array.from(adaptations.values());
}
