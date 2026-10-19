import { useCallback, useEffect, useState } from 'react';
import type {
  ArticleCategoryFilter,
  ArticlePersonalFilter,
  ArticleReadyLevelFilter,
  ArticleSortFilter,
} from '../../components/articlesToolbar/types';

type ArticleFilters = {
  searchValue: string;
  categoryFilter: ArticleCategoryFilter;
  sortByFilter: ArticleSortFilter;
  preferImagesFirst: boolean;
  readyLevelFilter: ArticleReadyLevelFilter;
  readyAdaptationEnabled: boolean;
  readySummaryEnabled: boolean;
  recommendedArticles: boolean;
  personalFilter: ArticlePersonalFilter;
};

const ARTICLE_SEARCH_DEBOUNCE_MS = 1200;
const DEFAULT_FILTERS: ArticleFilters = {
  searchValue: '',
  categoryFilter: 'all',
  sortByFilter: 'default',
  preferImagesFirst: false,
  readyLevelFilter: 'all',
  readyAdaptationEnabled: false,
  readySummaryEnabled: false,
  recommendedArticles: true,
  personalFilter: null,
};

/**
 * Coordinates article content filters, personal lists, and debounced search.
 * Content-filter changes clear the personal list; choosing a personal list resets
 * the other filters and search. Search is trimmed after the debounce delay, with
 * pending timers cleared when search changes or the hook unmounts.
 *
 * @returns Current filters, debounced search, the derived transformation filter,
 * and change/reset handlers. Resetting also clears debounced search immediately.
 * @example
 * // Inside a component or another hook:
 * const filters = useArticleFilters();
 * filters.handleChangePersonalFilter('saved');
 * // Selects the saved list and resets content filters and search.
 */
export function useArticleFilters() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('');
  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedSearchValue(filters.searchValue.trim()),
      ARTICLE_SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timeout);
  }, [filters.searchValue]);

  const changeContentFilter = useCallback(
    (changes: Partial<ArticleFilters>) => {
      setFilters((current) => ({
        ...current,
        ...changes,
        personalFilter: null,
      }));
    },
    [],
  );
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setDebouncedSearchValue('');
  }, []);
  const handleChangePersonalFilter = useCallback(
    (personalFilter: ArticlePersonalFilter) => {
      setFilters({ ...DEFAULT_FILTERS, personalFilter });
      setDebouncedSearchValue('');
    },
    [],
  );

  return {
    ...filters,
    debouncedSearchValue,
    readyTransformationType:
      filters.readyAdaptationEnabled && filters.readySummaryEnabled
        ? ('both' as const)
        : filters.readyAdaptationEnabled
          ? ('adaptation' as const)
          : filters.readySummaryEnabled
            ? ('summary' as const)
            : undefined,
    clearFilters,
    handleChangePersonalFilter,
    handleChangeCategoryFilter: (categoryFilter: ArticleCategoryFilter) =>
      changeContentFilter({ categoryFilter }),
    handleChangeSortByFilter: (sortByFilter: ArticleSortFilter) =>
      changeContentFilter({ sortByFilter }),
    handleChangeSearchValue: (searchValue: string) =>
      changeContentFilter({ searchValue }),
    handleChangeReadyLevelFilter: (readyLevelFilter: ArticleReadyLevelFilter) =>
      changeContentFilter({ readyLevelFilter }),
    handleChangePreferImagesFirst: (preferImagesFirst: boolean) =>
      changeContentFilter({ preferImagesFirst }),
    handleChangeReadyAdaptationEnabled: (readyAdaptationEnabled: boolean) =>
      changeContentFilter({ readyAdaptationEnabled }),
    handleChangeReadySummaryEnabled: (readySummaryEnabled: boolean) =>
      changeContentFilter({ readySummaryEnabled }),
    handleChangeRecommendedArticles: (recommendedArticles: boolean) =>
      changeContentFilter({ recommendedArticles }),
  };
}
