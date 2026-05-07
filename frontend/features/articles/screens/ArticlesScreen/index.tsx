import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  View,
  type ListRenderItem,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  type ArticleAdaptationSummary,
  fetchWikipediaArticles,
  type WikipediaArticle,
  type WikipediaArticleCategory,
} from '@/api/wikipedia';
import { DEFAULT_ARTICLE_LIMIT } from '@/api/wikipedia/constants';
import { useBanner } from '@/components/banner';
import { Button } from '@/components/button';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import { IconSymbol } from '@/components/ui/iconSymbol';
import { Colors } from '@/constants/theme';
import {
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

import { styles } from './styles';
import { ArticleThumbnail } from './components/articleThumbnail';
import {
  ArticlesToolbar,
  type ArticleCategoryFilter,
  type ArticlePersonalFilter,
  type ArticlePreviewLengthFilter,
} from './components/articlesToolbar';

const ARTICLE_SEARCH_DEBOUNCE_MS = 1200;

export default function ArticlesScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const savedAccentColor = colorScheme === 'dark' ? '#c4a7ff' : tintColor;
  const { showBanner } = useBanner();
  const borderColor = colorScheme === 'dark' ? '#2d3336' : '#d0d7de';
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('');
  const [previewLengthFilter, setPreviewLengthFilter] =
    useState<ArticlePreviewLengthFilter>('all');
  const [categoryFilter, setCategoryFilter] =
    useState<ArticleCategoryFilter>('all');
  const [recommendedArticles, setRecommendedArticles] = useState(true);
  const [personalFilter, setPersonalFilter] = useState<ArticlePersonalFilter>(null);
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const [expandedAdaptationArticleIds, setExpandedAdaptationArticleIds] =
    useState<Record<number, boolean>>({});

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchValue(searchValue.trim());
    }, ARTICLE_SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
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
      if (lastPage.length < DEFAULT_ARTICLE_LIMIT) {
        return undefined;
      }

      return pages.flat().map((article) => article.id);
    },
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam }) =>
      fetchWikipediaArticles({
        category: categoryFilter as WikipediaArticleCategory,
        excludeIds: pageParam,
        previewLength: previewLengthFilter,
        recommended: recommendedArticles,
        search: debouncedSearchValue,
      }),
    queryKey: [
      'wikipedia',
      'articles',
      debouncedSearchValue,
      categoryFilter,
      previewLengthFilter,
      recommendedArticles,
    ],
  });
  const { data: savedArticles = [] } = useQuery({
    queryFn: readSavedArticles,
    queryKey: SAVED_ARTICLES_QUERY_KEY,
  });
  const { data: recentArticles = [] } = useQuery({
    queryFn: readRecentArticles,
    queryKey: RECENT_ARTICLES_QUERY_KEY,
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
      const nextSavedArticles = saved
        ? await removeSavedArticle(article.id)
        : await saveArticleForLater(article);

      return {
        saved: !saved,
        savedArticles: nextSavedArticles,
      };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousSavedArticles) {
        queryClient.setQueryData(
          SAVED_ARTICLES_QUERY_KEY,
          context.previousSavedArticles,
        );
      }

      showBanner({
        title: t('article.savedArticles.error'),
        variant: 'error',
      });
    },
    onMutate: async ({ article, saved }) => {
      await queryClient.cancelQueries({ queryKey: SAVED_ARTICLES_QUERY_KEY });

      const previousSavedArticles =
        queryClient.getQueryData<SavedArticle[]>(SAVED_ARTICLES_QUERY_KEY) ?? [];
      const nextSavedArticles = saved
        ? previousSavedArticles.filter((savedArticle) => savedArticle.id !== article.id)
        : createSavedArticlesWithArticle(previousSavedArticles, article);

      queryClient.setQueryData(SAVED_ARTICLES_QUERY_KEY, nextSavedArticles);

      return { previousSavedArticles };
    },
    onSuccess: (response) => {
      queryClient.setQueryData(SAVED_ARTICLES_QUERY_KEY, response.savedArticles);
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
  const displayedArticles =
    personalFilter === 'saved'
      ? savedArticles
      : personalFilter === 'recent'
        ? recentArticles
        : articles;
  const shouldShowInitialLoader =
    personalFilter === null && isLoading && articles.length === 0;
  const shouldShowErrorState =
    personalFilter === null && Boolean(error) && articles.length === 0;
  const isUpdatingResults =
    personalFilter === null && isFetching && !isFetchingNextPage && !shouldShowInitialLoader;
  const shouldShowLoadMore =
    personalFilter === null && articles.length > 0 && hasNextPage;

  const clearFilters = useCallback(() => {
    setSearchValue('');
    setDebouncedSearchValue('');
    setPreviewLengthFilter('all');
    setCategoryFilter('all');
    setRecommendedArticles(true);
    setPersonalFilter(null);
  }, []);

  const handleChangeCategoryFilter = useCallback((value: ArticleCategoryFilter) => {
    setPersonalFilter(null);
    setCategoryFilter(value);
  }, []);

  const handleChangePreviewLengthFilter = useCallback(
    (value: ArticlePreviewLengthFilter) => {
      setPersonalFilter(null);
      setPreviewLengthFilter(value);
    },
    [],
  );

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
    setPreviewLengthFilter('all');
    setCategoryFilter('all');
    setRecommendedArticles(true);
    setPersonalFilter(value);
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
        <Pressable
          style={({ pressed }) => [
            styles.articleCard,
            { borderColor },
            pressed ? styles.articleCardPressed : null,
          ]}
          onPress={() => openArticle(item)}>
          <ArticleThumbnail
            borderColor={borderColor}
            iconColor={iconColor}
            thumbnailUrl={item.thumbnailUrl}
            title={item.title}
          />

          <View style={styles.articleContent}>
            <View style={styles.articleTitleRow}>
              <ThemedText type="sectionTitle" style={styles.articleTitle}>
                {item.title}
              </ThemedText>
            </View>
            <ThemedText type="body" style={styles.articleExtract} numberOfLines={5}>
              {item.extract}
            </ThemedText>
            {item.availableAdaptations?.length ? (
              <View style={styles.adaptations}>
                <Pressable
                  onPress={(event) => {
                    event.stopPropagation();
                    toggleAdaptations(item.id);
                  }}
                  style={styles.adaptationsToggle}>
                  <ThemedText type="bodyStrong" style={styles.adaptationsToggleText}>
                    {t('articles.adaptationsAvailable')}
                  </ThemedText>
                  <Ionicons
                    color={iconColor}
                    name={
                      expandedAdaptationArticleIds[item.id]
                        ? 'chevron-up'
                        : 'chevron-down'
                    }
                    size={16}
                  />
                </Pressable>
                {expandedAdaptationArticleIds[item.id] ? (
                  <View style={styles.adaptationsPanel}>
                    {formatAdaptations(item.availableAdaptations).map((label) => (
                      <ThemedText key={label} type="description" style={styles.adaptationLine}>
                        {label}
                      </ThemedText>
                    ))}
                    <ThemedText type="description" style={styles.adaptationsHint}>
                      {t('articles.adaptationsHint')}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
          <View style={styles.articleActionsColumn}>
            <Pressable
              accessibilityLabel={
                isSaved
                  ? t('article.savedArticles.removeAction')
                  : t('article.savedArticles.saveAction')
              }
              onPress={(event) => {
                event.stopPropagation();
                toggleSavedArticle(item);
              }}
              style={styles.cardBookmarkButton}>
              <IconSymbol
                color={isSaved ? savedAccentColor : iconColor}
                name={isSaved ? 'bookmark.fill' : 'bookmark'}
                size={22}
              />
            </Pressable>
            {wasOpened ? (
              <View
                accessibilityLabel={t('articles.recent.openedIndicator')}
                style={styles.openedIndicator}>
                <Ionicons
                  color={colorScheme === 'dark' ? '#9ba1a6' : '#687076'}
                  name="eye-outline"
                  size={16}
                />
              </View>
            ) : null}
          </View>
        </Pressable>
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
      t,
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

  if (shouldShowErrorState) {
    return (
      <ScreenContainer>
        <View style={styles.centerState}>
          <ThemedText type="screenTitle" style={styles.centerTitle}>
            {t('articles.errorTitle')}
          </ThemedText>
          <ThemedText type="description" style={styles.centerDescription}>
            {t('articles.errorDescription')}
          </ThemedText>
          <Button onPress={() => refetch()}>{t('articles.retry')}</Button>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
      <FlatList
        data={displayedArticles}
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
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
              onChangePreviewLengthFilter={handleChangePreviewLengthFilter}
              onChangeSearchValue={handleChangeSearchValue}
              onClearFilters={clearFilters}
              previewLengthFilter={previewLengthFilter}
              recommendedArticles={recommendedArticles}
              recentArticlesCount={recentArticles.length}
              resultCount={displayedArticles.length}
              savedArticlesCount={savedArticles.length}
              searchValue={searchValue}
            />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ThemedText type="sectionTitle" style={styles.centerTitle}>
              {personalFilter === 'saved'
                ? t('articles.saved.emptyTitle')
                : personalFilter === 'recent'
                  ? t('articles.recent.emptyTitle')
                : t('articles.emptyTitle')}
            </ThemedText>
            <ThemedText type="body" style={styles.centerDescription}>
              {personalFilter === 'saved'
                ? t('articles.saved.emptyDescription')
                : personalFilter === 'recent'
                  ? t('articles.recent.emptyDescription')
                : debouncedSearchValue.length > 0
                  ? t('articles.emptySearchDescription')
                  : t('articles.emptyFilterDescription')}
            </ThemedText>
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
    </ScreenContainer>
  );
}

function formatAdaptations(adaptations: ArticleAdaptationSummary[]): string[] {
  const percentsByLevel = new Map<string, number[]>();

  adaptations.forEach((adaptation) => {
    const currentPercents = percentsByLevel.get(adaptation.level) ?? [];

    currentPercents.push(adaptation.targetPercent);
    percentsByLevel.set(adaptation.level, currentPercents);
  });

  return Array.from(percentsByLevel.entries()).map(([level, percents]) => {
    const sortedPercents = Array.from(new Set(percents)).sort((left, right) => left - right);

    return `${level} - ${sortedPercents.map((percent) => `${percent}%`).join(' ')}`;
  });
}
