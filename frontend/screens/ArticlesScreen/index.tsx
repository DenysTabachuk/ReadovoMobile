import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Image } from 'expo-image';
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
  fetchWikipediaArticles,
  type WikipediaArticle,
  type WikipediaArticleCategory,
} from '@/api/wikipedia';
import { DEFAULT_ARTICLE_LIMIT } from '@/api/wikipedia/constants';
import { Button } from '@/components/button';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

import { styles } from './styles';
import {
  ArticlesToolbar,
  type ArticleCategoryFilter,
  type ArticlePreviewLengthFilter,
} from './components/articlesToolbar';

const ARTICLE_SEARCH_DEBOUNCE_MS = 1200;

export default function ArticlesScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = colorScheme === 'dark' ? '#2d3336' : '#d0d7de';
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('');
  const [previewLengthFilter, setPreviewLengthFilter] =
    useState<ArticlePreviewLengthFilter>('all');
  const [categoryFilter, setCategoryFilter] =
    useState<ArticleCategoryFilter>('all');
  const [recommendedArticles, setRecommendedArticles] = useState(true);
  const [isManualRefresh, setIsManualRefresh] = useState(false);

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
  } = useInfiniteQuery({
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
  const articles = useMemo(() => {
    const articleById = new Map<number, WikipediaArticle>();

    for (const article of data?.pages.flat() ?? []) {
      articleById.set(article.id, article);
    }

    return Array.from(articleById.values());
  }, [data?.pages]);
  const shouldShowInitialLoader = isLoading && articles.length === 0;
  const shouldShowErrorState = Boolean(error) && articles.length === 0;
  const isUpdatingResults =
    isFetching && !isFetchingNextPage && !shouldShowInitialLoader;
  const shouldShowLoadMore = articles.length > 0 && hasNextPage;

  const clearFilters = useCallback(() => {
    setSearchValue('');
    setDebouncedSearchValue('');
    setPreviewLengthFilter('all');
    setCategoryFilter('all');
    setRecommendedArticles(true);
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

  const openArticle = useCallback(
    (article: WikipediaArticle) => {
      router.push({
        pathname: '/article/[id]',
        params: {
          id: String(article.id),
        },
      });
    },
    []
  );

  const renderArticle = useCallback<ListRenderItem<WikipediaArticle>>(
    ({ item }) => (
      <Pressable
        style={({ pressed }) => [
          styles.articleCard,
          { borderColor },
          pressed ? styles.articleCardPressed : null,
        ]}
        onPress={() => openArticle(item)}>
        {item.thumbnailUrl ? (
          <Image
            accessibilityIgnoresInvertColors
            cachePolicy="disk"
            contentFit="cover"
            source={{ uri: item.thumbnailUrl }}
            style={styles.articleImage}
            transition={100}
          />
        ) : (
          <View style={[styles.imagePlaceholder, { borderColor }]}>
            <ThemedText type="sectionTitle" style={{ color: iconColor }}>
              W
            </ThemedText>
          </View>
        )}

        <View style={styles.articleContent}>
          <ThemedText type="sectionTitle" style={styles.articleTitle}>
            {item.title}
          </ThemedText>
          <ThemedText type="body" style={styles.articleExtract}>
            {item.extract}
          </ThemedText>
        </View>
      </Pressable>
    ),
    [borderColor, iconColor, openArticle]
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
        data={articles}
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="screenTitle">{t('articles.title')}</ThemedText>
            <ThemedText type="description" style={styles.description}>
              {t('articles.description')}
            </ThemedText>
            <ArticlesToolbar
              categoryFilter={categoryFilter}
              isRefreshingResults={isUpdatingResults}
              isSearchActive={debouncedSearchValue.length > 0}
              onChangeRecommendedArticles={setRecommendedArticles}
              onChangeCategoryFilter={setCategoryFilter}
              onChangePreviewLengthFilter={setPreviewLengthFilter}
              onChangeSearchValue={setSearchValue}
              onClearFilters={clearFilters}
              previewLengthFilter={previewLengthFilter}
              recommendedArticles={recommendedArticles}
              resultCount={articles.length}
              searchValue={searchValue}
            />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ThemedText type="sectionTitle" style={styles.centerTitle}>
              {t('articles.emptyTitle')}
            </ThemedText>
            <ThemedText type="body" style={styles.centerDescription}>
              {debouncedSearchValue.length > 0
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
          <RefreshControl
            refreshing={isManualRefresh}
            tintColor={Colors[colorScheme ?? 'light'].tint}
            onRefresh={handleRefresh}
          />
        }
        renderItem={renderArticle}
        removeClippedSubviews={false}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}
