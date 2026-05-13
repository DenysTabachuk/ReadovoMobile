import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
  type ListRenderItem,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  fetchArticleAdaptations,
  fetchWikipediaArticles,
  type WikipediaArticle,
  type WikipediaArticleCategory,
} from '@/api/wikipedia';
import { DEFAULT_ARTICLE_LIMIT } from '@/api/wikipedia/constants';
import { useBanner } from '@/components/banner';
import { Button } from '@/components/button';
import { ScreenContainer } from '@/components/screenContainer';
import { ScrollToTopButton } from '@/components/scrollToTopButton';
import { ThemedText } from '@/components/themedText';
import { Spacing } from '@/constants/spacing';
import { Colors } from '@/constants/theme';
import {
  ArticleCard,
  createSavedArticlesWithArticle,
  isArticleRecentlyOpened,
  isArticleSaved,
  readSavedArticles,
  readRecentArticles,
  removeSavedArticle,
  saveArticleForLater,
  RECENT_ARTICLES_QUERY_KEY,
  SAVED_ARTICLES_QUERY_KEY,
  type SavedArticle,
} from '@/features/articles';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/providers/authProvider';

import { styles } from './styles';
import {
  ArticlesToolbar,
  type ArticleCategoryFilter,
  type ArticlePersonalFilter,
  type ArticleReadyLevelFilter,
  type ArticleSortFilter,
} from './components/articlesToolbar';

const ARTICLE_SEARCH_DEBOUNCE_MS = 1200;

export default function ArticlesScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const colorScheme = useColorScheme();
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const savedAccentColor = colorScheme === 'dark' ? '#c4a7ff' : tintColor;
  const { showBanner } = useBanner();
  const borderColor = colorScheme === 'dark' ? '#2d3336' : '#d0d7de';
  const userId = currentUser?.id;
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('');
  const [categoryFilter, setCategoryFilter] =
    useState<ArticleCategoryFilter>('all');
  const [sortByFilter, setSortByFilter] =
    useState<ArticleSortFilter>('default');
  const [preferImagesFirst, setPreferImagesFirst] = useState(false);
  const [readyLevelFilter, setReadyLevelFilter] =
    useState<ArticleReadyLevelFilter>('all');
  const [readyAdaptationEnabled, setReadyAdaptationEnabled] = useState(false);
  const [readySummaryEnabled, setReadySummaryEnabled] = useState(false);
  const [recommendedArticles, setRecommendedArticles] = useState(true);
  const [personalFilter, setPersonalFilter] = useState<ArticlePersonalFilter>(null);
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const [scrollOffsetY, setScrollOffsetY] = useState(0);
  const [expandedAdaptationArticleIds, setExpandedAdaptationArticleIds] =
    useState<Record<number, boolean>>({});
  const listRef = useRef<FlatList<WikipediaArticle>>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchValue(searchValue.trim());
    }, ARTICLE_SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  const readyTransformationType =
    readyAdaptationEnabled && readySummaryEnabled
      ? 'both'
      : readyAdaptationEnabled
        ? 'adaptation'
        : readySummaryEnabled
          ? 'summary'
          : undefined;

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery<
    WikipediaArticle[],
    Error,
    InfiniteData<WikipediaArticle[], number[]>,
    QueryKey,
    number[]
  >({
    initialPageParam: [] as number[],
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length === 0) {
        return undefined;
      }

      return pages.flat().map((article) => article.id);
    },
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam }) =>
      fetchWikipediaArticles({
        category: categoryFilter as WikipediaArticleCategory,
        excludeIds: pageParam,
        preferImagesFirst,
        readyLevel: readyLevelFilter,
        readyTransformationType,
        recommended: recommendedArticles,
        search: debouncedSearchValue,
        sortBy: sortByFilter,
      }),
    queryKey: [
      'wikipedia',
      'articles',
      debouncedSearchValue,
      categoryFilter,
      preferImagesFirst,
      readyLevelFilter,
      readyAdaptationEnabled,
      readySummaryEnabled,
      recommendedArticles,
      sortByFilter,
    ],
  });
  const { data: savedArticles = [] } = useQuery({
    enabled: Boolean(userId),
    queryFn: () => readSavedArticles(userId ?? ''),
    queryKey: [...SAVED_ARTICLES_QUERY_KEY, userId],
  });
  const { data: recentArticles = [] } = useQuery({
    enabled: Boolean(userId),
    queryFn: () => readRecentArticles(userId ?? ''),
    queryKey: [...RECENT_ARTICLES_QUERY_KEY, userId],
  });
  const personalArticleIds = useMemo(() => {
    const sourceArticles =
      personalFilter === 'saved'
        ? savedArticles
        : personalFilter === 'recent'
          ? recentArticles
          : [];

    return sourceArticles.map((article) => article.id);
  }, [personalFilter, recentArticles, savedArticles]);
  const { data: personalArticleAdaptations = {} } = useQuery({
    enabled: personalArticleIds.length > 0,
    queryFn: () => fetchArticleAdaptations(personalArticleIds, 'all'),
    queryKey: ['wikipedia', 'article-adaptations', personalArticleIds],
  });
  const savedArticleMutation = useMutation<
    { saved: boolean; savedArticles: SavedArticle[] },
    Error,
    { article: WikipediaArticle; saved: boolean },
    { previousSavedArticles?: SavedArticle[] }
  >({
    mutationFn: async ({
      article,
      saved,
    }: {
      article: WikipediaArticle;
      saved: boolean;
    }) => {
      if (!userId) {
        throw new Error('auth.required');
      }

      const nextSavedArticles = saved
        ? await removeSavedArticle(userId, article.id)
        : await saveArticleForLater(userId, article);

      return {
        saved: !saved,
        savedArticles: nextSavedArticles,
      };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousSavedArticles) {
        queryClient.setQueryData(
          [...SAVED_ARTICLES_QUERY_KEY, userId],
          context.previousSavedArticles,
        );
      }

      showBanner({
        title: t('article.savedArticles.error'),
        variant: 'error',
      });
    },
    onMutate: async ({ article, saved }) => {
      await queryClient.cancelQueries({
        queryKey: [...SAVED_ARTICLES_QUERY_KEY, userId],
      });

      const previousSavedArticles =
        queryClient.getQueryData<SavedArticle[]>([
          ...SAVED_ARTICLES_QUERY_KEY,
          userId,
        ]) ?? [];
      const nextSavedArticles = saved
        ? previousSavedArticles.filter((savedArticle) => savedArticle.id !== article.id)
        : createSavedArticlesWithArticle(previousSavedArticles, article);

      queryClient.setQueryData(
        [...SAVED_ARTICLES_QUERY_KEY, userId],
        nextSavedArticles,
      );

      return { previousSavedArticles };
    },
    onSuccess: (response) => {
      queryClient.setQueryData(
        [...SAVED_ARTICLES_QUERY_KEY, userId],
        response.savedArticles,
      );
      showBanner({
        title: response.saved
          ? t('article.savedArticles.saved')
          : t('article.savedArticles.removed'),
        variant: 'success',
      });
    },
  });
  const articles = useMemo(() => {
    const articleById = new Map<number, WikipediaArticle>();

    for (const article of data?.pages.flat() ?? []) {
      articleById.set(article.id, article);
    }

    return Array.from(articleById.values());
  }, [data?.pages]);
  const availableAdaptationsByArticleId = useMemo(() => {
    const adaptationsByArticleId = new Map<
      number,
      WikipediaArticle['availableAdaptations']
    >();

    articles.forEach((article) => {
      if (article.availableAdaptations?.length) {
        adaptationsByArticleId.set(article.id, article.availableAdaptations);
      }
    });

    return adaptationsByArticleId;
  }, [articles]);
  const displayedArticles = useMemo(() => {
    const sourceArticles =
      personalFilter === 'saved'
        ? savedArticles
        : personalFilter === 'recent'
          ? recentArticles
          : articles;

    return sourceArticles.map((article) => {
      const availableAdaptations =
        article.availableAdaptations ??
        personalArticleAdaptations[String(article.id)] ??
        availableAdaptationsByArticleId.get(article.id);

      return availableAdaptations?.length
        ? { ...article, availableAdaptations }
        : article;
    });
  }, [
    articles,
    availableAdaptationsByArticleId,
    personalFilter,
    personalArticleAdaptations,
    recentArticles,
    savedArticles,
  ]);
  const shouldShowInitialLoader =
    personalFilter === null && isLoading && articles.length === 0;
  const shouldShowErrorState =
    personalFilter === null &&
    isError &&
    Boolean(error) &&
    !isFetching &&
    !data;
  const isUpdatingResults =
    personalFilter === null && isFetching && !isFetchingNextPage && !shouldShowInitialLoader;
  const shouldShowLoadMore =
    personalFilter === null && articles.length > 0 && hasNextPage;
  const hasActiveContentFilters =
    categoryFilter !== 'all' ||
    sortByFilter !== 'default' ||
    preferImagesFirst ||
    readyLevelFilter !== 'all' ||
    readyAdaptationEnabled ||
    readySummaryEnabled ||
    !recommendedArticles;

  const clearFilters = useCallback(() => {
    setSearchValue('');
    setDebouncedSearchValue('');
    setCategoryFilter('all');
    setSortByFilter('default');
    setPreferImagesFirst(false);
    setReadyLevelFilter('all');
    setReadyAdaptationEnabled(false);
    setReadySummaryEnabled(false);
    setRecommendedArticles(true);
    setPersonalFilter(null);
  }, []);

  const handleChangeCategoryFilter = useCallback((value: ArticleCategoryFilter) => {
    setPersonalFilter(null);
    setCategoryFilter(value);
  }, []);

  const handleChangeSortByFilter = useCallback((value: ArticleSortFilter) => {
    setPersonalFilter(null);
    setSortByFilter(value);
  }, []);

  const handleChangePreferImagesFirst = useCallback((value: boolean) => {
    setPersonalFilter(null);
    setPreferImagesFirst(value);
  }, []);

  const handleChangeReadyLevelFilter = useCallback(
    (value: ArticleReadyLevelFilter) => {
      setPersonalFilter(null);
      setReadyLevelFilter(value);
    },
    [],
  );

  const handleChangeReadyAdaptationEnabled = useCallback((value: boolean) => {
    setPersonalFilter(null);
    setReadyAdaptationEnabled(value);
  }, []);

  const handleChangeReadySummaryEnabled = useCallback((value: boolean) => {
    setPersonalFilter(null);
    setReadySummaryEnabled(value);
  }, []);

  const handleChangeRecommendedArticles = useCallback((value: boolean) => {
    setPersonalFilter(null);
    setRecommendedArticles(value);
  }, []);

  const handleChangeSearchValue = useCallback((value: string) => {
    setPersonalFilter(null);
    setSearchValue(value);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsManualRefresh(true);

    try {
      await refetch();
    } finally {
      setIsManualRefresh(false);
    }
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (isFetchingNextPage || !hasNextPage) {
      return;
    }

    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const toggleAdaptations = useCallback((articleId: number) => {
    setExpandedAdaptationArticleIds((current) => ({
      ...current,
      [articleId]: !current[articleId],
    }));
  }, []);

  const handleChangePersonalFilter = useCallback((value: ArticlePersonalFilter) => {
    setSearchValue('');
    setDebouncedSearchValue('');
    setCategoryFilter('all');
    setSortByFilter('default');
    setPreferImagesFirst(false);
    setReadyLevelFilter('all');
    setReadyAdaptationEnabled(false);
    setReadySummaryEnabled(false);
    setRecommendedArticles(true);
    setPersonalFilter(value);
  }, []);
  const handleToggleFilters = useCallback((isCollapsed: boolean) => {
    if (!isCollapsed) {
      return;
    }

    listRef.current?.scrollToOffset({
      animated: true,
      offset: 0,
    });
  }, []);

  const openArticle = useCallback((article: WikipediaArticle) => {
    router.push({
      pathname: '/article/[id]',
      params: {
        id: String(article.id),
      },
    });
  }, []);

  const toggleSavedArticle = useCallback(
    (article: WikipediaArticle) => {
      savedArticleMutation.mutate({
        article,
        saved: isArticleSaved(article.id, savedArticles),
      });
    },
    [savedArticleMutation, savedArticles],
  );

  const renderArticle = useCallback<ListRenderItem<WikipediaArticle>>(
    ({ item }) => {
      const isSaved = isArticleSaved(item.id, savedArticles);
      const wasOpened = isArticleRecentlyOpened(item.id, recentArticles);

      return (
        <ArticleCard
          article={item}
          borderColor={borderColor}
          colorScheme={colorScheme}
          expandedAdaptations={Boolean(expandedAdaptationArticleIds[item.id])}
          iconColor={iconColor}
          isSaved={isSaved}
          onOpen={openArticle}
          onToggleAdaptations={toggleAdaptations}
          onToggleSaved={toggleSavedArticle}
          savedAccentColor={savedAccentColor}
          tintColor={tintColor}
          wasOpened={wasOpened}
        />
      );
    },
    [
      borderColor,
      colorScheme,
      expandedAdaptationArticleIds,
      iconColor,
      openArticle,
      recentArticles,
      savedArticles,
      savedAccentColor,
      tintColor,
      toggleAdaptations,
      toggleSavedArticle,
    ],
  );

  if (shouldShowInitialLoader) {
    return (
      <ScreenContainer>
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors[colorScheme ?? 'light'].tint} size="large" />
          <ThemedText type="body">{t('articles.loading')}</ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
      <FlatList
        ref={listRef}
        data={displayedArticles}
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        onScroll={(event) => {
          const currentOffsetY = event.nativeEvent.contentOffset.y;
          setScrollOffsetY(currentOffsetY);
        }}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerTitleGroup}>
                <ThemedText type="screenTitle">{t('articles.title')}</ThemedText>
                <ThemedText type="description" style={styles.description}>
                  {t('articles.description')}
                </ThemedText>
              </View>
            </View>
            <ArticlesToolbar
              categoryFilter={categoryFilter}
              personalFilter={personalFilter}
              isRefreshingResults={isUpdatingResults}
              isSearchActive={debouncedSearchValue.length > 0}
              onChangeRecommendedArticles={handleChangeRecommendedArticles}
              onChangeCategoryFilter={handleChangeCategoryFilter}
              onChangePersonalFilter={handleChangePersonalFilter}
              onChangePreferImagesFirst={handleChangePreferImagesFirst}
              onChangeReadyAdaptationEnabled={
                handleChangeReadyAdaptationEnabled
              }
              onChangeReadyLevelFilter={handleChangeReadyLevelFilter}
              onChangeReadySummaryEnabled={handleChangeReadySummaryEnabled}
              onChangeSearchValue={handleChangeSearchValue}
              onChangeSortByFilter={handleChangeSortByFilter}
              onClearFilters={clearFilters}
              onToggleFilters={handleToggleFilters}
              preferImagesFirst={preferImagesFirst}
              readyAdaptationEnabled={readyAdaptationEnabled}
              readyLevelFilter={readyLevelFilter}
              readySummaryEnabled={readySummaryEnabled}
              recommendedArticles={recommendedArticles}
              recentArticlesCount={recentArticles.length}
              resultCount={displayedArticles.length}
              savedArticlesCount={savedArticles.length}
              searchValue={searchValue}
              sortByFilter={sortByFilter}
            />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {shouldShowErrorState ? (
              <>
                <ThemedText type="sectionTitle" style={styles.centerTitle}>
                  {t('articles.loadErrorTitle')}
                </ThemedText>
                <ThemedText type="body" style={styles.centerDescription}>
                  {t('articles.loadErrorDescription')}
                </ThemedText>
                <Button onPress={() => refetch()}>{t('articles.retry')}</Button>
              </>
            ) : (
              <>
                <ThemedText type="sectionTitle" style={styles.centerTitle}>
                  {personalFilter === 'saved'
                    ? t('articles.saved.emptyTitle')
                    : personalFilter === 'recent'
                      ? t('articles.recent.emptyTitle')
                      : hasActiveContentFilters
                        ? t('articles.emptyFilteredTitle')
                        : t('articles.emptyTitle')}
                </ThemedText>
                <ThemedText type="body" style={styles.centerDescription}>
                  {personalFilter === 'saved'
                    ? t('articles.saved.emptyDescription')
                    : personalFilter === 'recent'
                      ? t('articles.recent.emptyDescription')
                      : hasActiveContentFilters
                        ? t('articles.emptyFilteredDescription')
                        : debouncedSearchValue.length > 0
                        ? t('articles.emptySearchDescription')
                        : t('articles.emptyFilterDescription')}
                </ThemedText>
              </>
            )}
          </View>
        }
        ListFooterComponent={
          shouldShowLoadMore ? (
            <View style={styles.loadMoreFooter}>
              <Button
                disabled={isFetchingNextPage}
                onPress={handleLoadMore}
                style={styles.loadMoreButton}>
                {isFetchingNextPage
                  ? t('articles.loadingMore')
                  : t('articles.loadMore')}
              </Button>
            </View>
          ) : null
        }
        refreshControl={
          personalFilter !== null ? undefined : (
            <RefreshControl
              refreshing={isManualRefresh}
              tintColor={Colors[colorScheme ?? 'light'].tint}
              onRefresh={handleRefresh}
            />
          )
        }
        renderItem={renderArticle}
        removeClippedSubviews={false}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      <ScrollToTopButton
        bottomOffset={72}
        rightOffset={Spacing.md}
        scrollOffsetY={scrollOffsetY}
        scrollRef={listRef}
      />
    </ScreenContainer>
  );
}
