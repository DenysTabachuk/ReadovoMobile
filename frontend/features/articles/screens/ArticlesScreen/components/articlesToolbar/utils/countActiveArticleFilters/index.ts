import type { ArticlesToolbarProps } from '../../types';

type ActiveArticleFilters = Pick<
  ArticlesToolbarProps,
  | 'personalFilter'
  | 'searchValue'
  | 'preferImagesFirst'
  | 'readyLevelFilter'
  | 'readyAdaptationEnabled'
  | 'readySummaryEnabled'
  | 'sortByFilter'
  | 'categoryFilter'
  | 'recommendedArticles'
>;

/**
 * Count active filter groups displayed in the toolbar badge.
 *
 * @param filters - Current choices; adaptation and summary count as one group.
 * @returns Active groups, ignoring blank searches and default recommendations.
 * @example
 * countActiveArticleFilters({ personalFilter: null, searchValue: ' ', preferImagesFirst: false, readyLevelFilter: 'all', readyAdaptationEnabled: false, readySummaryEnabled: false, sortByFilter: 'default', categoryFilter: 'all', recommendedArticles: true });
 * // => 0
 */
export function countActiveArticleFilters(
  filters: ActiveArticleFilters,
): number {
  return (
    Number(filters.personalFilter !== null) +
    Number(filters.searchValue.trim().length > 0) +
    Number(filters.preferImagesFirst) +
    Number(filters.readyLevelFilter !== 'all') +
    Number(filters.readyAdaptationEnabled || filters.readySummaryEnabled) +
    Number(filters.sortByFilter !== 'default') +
    Number(filters.categoryFilter !== 'all') +
    Number(!filters.recommendedArticles)
  );
}
