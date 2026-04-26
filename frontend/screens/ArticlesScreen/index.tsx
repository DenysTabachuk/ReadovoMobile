import { useQuery } from '@tanstack/react-query';
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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchValue(searchValue.trim());
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  const {
    data: articles = [],
    error,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    queryFn: () =>
      fetchWikipediaArticles({
        category: categoryFilter as WikipediaArticleCategory,
        search: debouncedSearchValue,
      }),
    queryKey: ['wikipedia', 'articles', debouncedSearchValue, categoryFilter],
  });

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      if (previewLengthFilter === 'all') {
        return true;
      }

      const extractLength = article.extract.trim().length;

      if (previewLengthFilter === 'short') {
        return extractLength > 0 && extractLength <= 120;
      }

      if (previewLengthFilter === 'medium') {
        return extractLength >= 121 && extractLength <= 220;
      }

      return extractLength >= 221;
    });
  }, [articles, previewLengthFilter]);

  const clearFilters = useCallback(() => {
    setSearchValue('');
    setDebouncedSearchValue('');
    setPreviewLengthFilter('all');
    setCategoryFilter('all');
  }, []);

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
            source={{ uri: item.thumbnailUrl }}
            style={styles.articleImage}
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

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors[colorScheme ?? 'light'].tint} size="large" />
          <ThemedText type="body">{t('articles.loading')}</ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  if (error) {
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
        data={filteredArticles}
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
              isSearchActive={debouncedSearchValue.length > 0}
              onChangeCategoryFilter={setCategoryFilter}
              onChangePreviewLengthFilter={setPreviewLengthFilter}
              onChangeSearchValue={setSearchValue}
              onClearFilters={clearFilters}
              previewLengthFilter={previewLengthFilter}
              resultCount={filteredArticles.length}
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
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            tintColor={Colors[colorScheme ?? 'light'].tint}
            onRefresh={refetch}
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
