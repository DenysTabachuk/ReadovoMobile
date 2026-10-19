import {
  useArticleAdaptationsQuery,
  useRecentArticlesQuery,
  useSavedArticlesQuery,
  useToggleSavedArticleMutation,
  useWikipediaArticlesQuery,
} from '@/features/articles/api';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
  type ListRenderItem,
} from 'react-native';
import { ArticlesEmptyState } from './components/articlesEmptyState';
import { useArticleFilters } from './hooks/useArticleFilters';
import { mergeArticlePages } from './utils/mergeArticlePages';
import { resolveDisplayedArticles } from './utils/resolveDisplayedArticles';

import { Button } from '@/components/button';
import { ScreenContainer } from '@/components/screenContainer';
import { ScrollToTopButton } from '@/components/scrollToTopButton';
import { ThemedText } from '@/components/themedText';
import { Spacing } from '@/constants/spacing';
import { Colors } from '@/constants/theme';
import {
  ArticleCard,
  isArticleRecentlyOpened,
  isArticleSaved,
} from '@/features/articles';
import { type WikipediaArticle } from '@/features/articles/api';
import { useAuth } from '@/features/auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

import { ArticlesToolbar } from './components/articlesToolbar';
import { styles } from './styles';

const SCROLL_TO_TOP_BOTTOM_OFFSET = 72;

export default function ArticlesScreen() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const colorScheme = useColorScheme();
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const savedAccentColor = colorScheme === 'dark' ? '#c4a7ff' : tintColor;
  const borderColor = colorScheme === 'dark' ? '#2d3336' : '#d0d7de';
  const userId = currentUser?.id;
  const {
    searchValue,
    debouncedSearchValue,
    categoryFilter,
    sortByFilter,
    preferImagesFirst,
    readyLevelFilter,
    readyAdaptationEnabled,
    readySummaryEnabled,
    recommendedArticles,
    personalFilter,
    readyTransformationType,
    clearFilters,
    handleChangePersonalFilter,
    handleChangeCategoryFilter,
    handleChangeSortByFilter,
    handleChangeSearchValue,
    handleChangeReadyLevelFilter,
    handleChangePreferImagesFirst,
    handleChangeReadyAdaptationEnabled,
    handleChangeReadySummaryEnabled,
    handleChangeRecommendedArticles,
  } = useArticleFilters();
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true);
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const [scrollOffsetY, setScrollOffsetY] = useState(0);
  const [expandedAdaptationArticleIds, setExpandedAdaptationArticleIds] =
    useState<Record<number, boolean>>({});
  const listRef = useRef<FlatList<WikipediaArticle>>(null);
  const isOpeningArticleRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      isOpeningArticleRef.current = false;
    }, []),
  );

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
  } = useWikipediaArticlesQuery({
    category: categoryFilter,
    preferImagesFirst,
    readyLevel: readyLevelFilter,
    readyTransformationType,
    recommended: recommendedArticles,
    search: debouncedSearchValue,
    sortBy: sortByFilter,
  });
  const { data: savedArticles = [] } = useSavedArticlesQuery(userId);
  const { data: recentArticles = [] } = useRecentArticlesQuery(userId);
  const personalArticleIds = useMemo(() => {
    const sourceArticles =
      personalFilter === 'saved'
        ? savedArticles
        : personalFilter === 'recent'
          ? recentArticles
          : [];

    return sourceArticles.map((article) => article.id);
  }, [personalFilter, recentArticles, savedArticles]);
  const { data: personalArticleAdaptations = {} } =
    useArticleAdaptationsQuery(personalArticleIds);
  const savedArticleMutation = useToggleSavedArticleMutation();
  const articles = useMemo(() => mergeArticlePages(data?.pages), [data?.pages]);
  const displayedArticles = useMemo(
    () =>
      resolveDisplayedArticles({
        articles,
        savedArticles,
        recentArticles,
        personalFilter,
        personalArticleAdaptations,
      }),
    [
      articles,
      savedArticles,
      recentArticles,
      personalFilter,
      personalArticleAdaptations,
    ],
  );
  const shouldShowInitialLoader =
    personalFilter === null && isLoading && articles.length === 0;
  const shouldShowErrorState =
    personalFilter === null &&
    isError &&
    Boolean(error) &&
    !isFetching &&
    !data;
  const isUpdatingResults =
    personalFilter === null &&
    isFetching &&
    !isFetchingNextPage &&
    !shouldShowInitialLoader;
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

  const toggleFiltersCollapsed = useCallback(() => {
    setIsFiltersCollapsed((current) => !current);
  }, []);

  const openArticle = useCallback((article: WikipediaArticle) => {
    if (isOpeningArticleRef.current) {
      return;
    }

    isOpeningArticleRef.current = true;
    router.navigate({
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
          <ActivityIndicator
            color={Colors[colorScheme ?? 'light'].tint}
            size="large"
          />
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
                <ThemedText type="screenTitle">
                  {t('articles.title')}
                </ThemedText>
                <ThemedText type="description" style={styles.description}>
                  {t('articles.description')}
                </ThemedText>
              </View>
            </View>
            <ArticlesToolbar
              categoryFilter={categoryFilter}
              personalFilter={personalFilter}
              isFiltersCollapsed={isFiltersCollapsed}
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
              onToggleFiltersCollapsed={toggleFiltersCollapsed}
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
          <ArticlesEmptyState
            isError={shouldShowErrorState}
            personalFilter={personalFilter}
            hasActiveContentFilters={hasActiveContentFilters}
            isSearchActive={debouncedSearchValue.length > 0}
            onRetry={() => {
              void refetch();
            }}
          />
        }
        ListFooterComponent={
          shouldShowLoadMore ? (
            <View style={styles.loadMoreFooter}>
              <Button
                disabled={isFetchingNextPage}
                onPress={handleLoadMore}
                style={styles.loadMoreButton}
              >
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
        bottomOffset={SCROLL_TO_TOP_BOTTOM_OFFSET}
        rightOffset={Spacing.md}
        scrollOffsetY={scrollOffsetY}
        scrollRef={listRef}
      />
    </ScreenContainer>
  );
}
