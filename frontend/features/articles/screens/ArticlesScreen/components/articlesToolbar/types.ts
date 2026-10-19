export type ArticlePersonalFilter = 'recent' | 'saved' | null;
export type ArticleSortFilter = 'default' | 'length_desc' | 'length_asc';
export type ArticleReadyLevelFilter = 'all' | 'A1' | 'A2' | 'B1' | 'B2';
export type ArticleCategoryFilter =
  | 'all'
  | 'biography'
  | 'food'
  | 'geography'
  | 'history'
  | 'space'
  | 'sports'
  | 'science'
  | 'technology'
  | 'nature'
  | 'culture';

export type ArticlesToolbarProps = {
  categoryFilter: ArticleCategoryFilter;
  personalFilter: ArticlePersonalFilter;
  isRefreshingResults: boolean;
  isFiltersCollapsed: boolean;
  isSearchActive: boolean;
  preferImagesFirst: boolean;
  readyAdaptationEnabled: boolean;
  readyLevelFilter: ArticleReadyLevelFilter;
  readySummaryEnabled: boolean;
  recommendedArticles: boolean;
  recentArticlesCount: number;
  resultCount: number;
  savedArticlesCount: number;
  searchValue: string;
  sortByFilter: ArticleSortFilter;
  onChangeCategoryFilter: (value: ArticleCategoryFilter) => void;
  onChangePreferImagesFirst: (value: boolean) => void;
  onChangeReadyLevelFilter: (value: ArticleReadyLevelFilter) => void;
  onChangeReadyAdaptationEnabled: (value: boolean) => void;
  onChangeReadySummaryEnabled: (value: boolean) => void;
  onChangeRecommendedArticles: (value: boolean) => void;
  onChangeSearchValue: (value: string) => void;
  onChangeSortByFilter: (value: ArticleSortFilter) => void;
  onClearFilters: () => void;
  onChangePersonalFilter: (value: ArticlePersonalFilter) => void;
  onToggleFiltersCollapsed: () => void;
};
