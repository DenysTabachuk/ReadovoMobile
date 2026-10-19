import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ArticleContentFilters } from './components/articleContentFilters';
import { ArticleQuickFilters } from './components/articleQuickFilters';
import { PersonalArticlesFilter } from './components/personalArticlesFilter';
import { RecommendedArticlesFilter } from './components/recommendedArticlesFilter';
import { useArticlesFilterTheme } from './hooks/useArticlesFilterTheme';
import type { ArticlesToolbarProps } from './types';
import { countActiveArticleFilters } from './utils/countActiveArticleFilters';

import { ThemedText } from '@/components/themedText';
import { Spacing } from '@/constants/spacing';

import { styles } from './styles';
export type {
  ArticleCategoryFilter,
  ArticlePersonalFilter,
  ArticleReadyLevelFilter,
  ArticleSortFilter,
} from './types';

const FILTERS_ANIMATION_MS = 280;
const FILTERS_COLLAPSED_HEADER_HEIGHT = 44;
const FILTERS_EXPANDED_HEADER_HEIGHT = 68;
const FILTERS_CONTENT_HIDDEN_OFFSET = -8;

export function ArticlesToolbar({
  categoryFilter,
  personalFilter,
  isRefreshingResults,
  isFiltersCollapsed,
  isSearchActive,
  preferImagesFirst,
  readyAdaptationEnabled,
  readyLevelFilter,
  readySummaryEnabled,
  recommendedArticles,
  recentArticlesCount,
  resultCount,
  savedArticlesCount,
  searchValue,
  sortByFilter,
  onChangeCategoryFilter,
  onChangePreferImagesFirst,
  onChangeReadyLevelFilter,
  onChangeReadyAdaptationEnabled,
  onChangeReadySummaryEnabled,
  onChangeRecommendedArticles,
  onChangeSearchValue,
  onChangeSortByFilter,
  onClearFilters,
  onChangePersonalFilter,
  onToggleFiltersCollapsed,
}: ArticlesToolbarProps) {
  const { t } = useTranslation();
  const {
    borderColor,
    cardColor,
    sectionCardColor,
    tintColor,
    textColor,
    placeholderColor,
    mutedTextColor,
    clearIconColor,
  } = useArticlesFilterTheme();
  const [filtersContentHeight, setFiltersContentHeight] = useState(0);
  const filtersProgress = useSharedValue(0);
  const activeFiltersCount = countActiveArticleFilters({
    personalFilter,
    searchValue,
    preferImagesFirst,
    readyLevelFilter,
    readyAdaptationEnabled,
    readySummaryEnabled,
    sortByFilter,
    categoryFilter,
    recommendedArticles,
  });
  const hasActiveFilters = activeFiltersCount > 0;
  const clearSearch = useCallback(() => {
    onChangeSearchValue('');
  }, [onChangeSearchValue]);
  useEffect(() => {
    filtersProgress.value = withTiming(isFiltersCollapsed ? 0 : 1, {
      duration: FILTERS_ANIMATION_MS,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [filtersProgress, isFiltersCollapsed]);

  const animatedContentStyle = useAnimatedStyle(
    () => ({
      height: Math.max(filtersContentHeight, 1) * filtersProgress.value,
      marginBottom: Spacing.sm * filtersProgress.value,
      opacity: filtersProgress.value,
      transform: [
        {
          translateY:
            (1 - filtersProgress.value) * FILTERS_CONTENT_HIDDEN_OFFSET,
        },
      ],
    }),
    [filtersContentHeight],
  );

  const animatedSheetContainerStyle = useAnimatedStyle(() => ({
    paddingTop: Spacing.md * filtersProgress.value,
    paddingBottom: Spacing.md * filtersProgress.value,
  }));

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    minHeight:
      FILTERS_COLLAPSED_HEADER_HEIGHT +
      (FILTERS_EXPANDED_HEADER_HEIGHT - FILTERS_COLLAPSED_HEADER_HEIGHT) *
        filtersProgress.value,
    paddingTop: Spacing.sm * filtersProgress.value,
    paddingBottom: Spacing.sm * filtersProgress.value,
  }));

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.searchInputContainer,
          {
            borderColor,
          },
        ]}
      >
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={onChangeSearchValue}
          placeholder={t('articles.searchPlaceholder')}
          placeholderTextColor={placeholderColor}
          returnKeyType="search"
          selectionColor={tintColor}
          style={[
            styles.searchInput,
            {
              color: textColor,
            },
          ]}
          value={searchValue}
        />
        {searchValue.length > 0 ? (
          <Pressable
            accessibilityLabel={t('articles.clearFilters')}
            hitSlop={8}
            onPress={clearSearch}
            style={({ pressed }) => [
              styles.searchClearButton,
              { opacity: pressed ? 0.64 : 1 },
            ]}
          >
            <Ionicons color={placeholderColor} name="close-circle" size={22} />
          </Pressable>
        ) : null}
      </View>

      <Animated.View
        style={[
          styles.sheetContainer,
          animatedSheetContainerStyle,
          {
            backgroundColor: sectionCardColor,
            borderColor,
          },
        ]}
      >
        <Animated.View
          pointerEvents={isFiltersCollapsed ? 'none' : 'auto'}
          style={[
            styles.filtersContentAnimated,
            filtersContentHeight > 0 ? animatedContentStyle : null,
          ]}
        >
          <View
            onLayout={(event) => {
              const nextHeight = Math.ceil(event.nativeEvent.layout.height);
              if (nextHeight > 0 && nextHeight !== filtersContentHeight) {
                setFiltersContentHeight(nextHeight);
              }
            }}
          >
            <>
              <RecommendedArticlesFilter
                recommendedArticles={recommendedArticles}
                onChangeRecommendedArticles={onChangeRecommendedArticles}
              />

              <PersonalArticlesFilter
                personalFilter={personalFilter}
                onChangePersonalFilter={onChangePersonalFilter}
                savedArticlesCount={savedArticlesCount}
                recentArticlesCount={recentArticlesCount}
              />

              <ArticleContentFilters
                categoryFilter={categoryFilter}
                personalFilter={personalFilter}
                onChangeCategoryFilter={onChangeCategoryFilter}
                sortByFilter={sortByFilter}
                onChangeSortByFilter={onChangeSortByFilter}
              />

              <ArticleQuickFilters
                preferImagesFirst={preferImagesFirst}
                readyLevelFilter={readyLevelFilter}
                readyAdaptationEnabled={readyAdaptationEnabled}
                readySummaryEnabled={readySummaryEnabled}
                onChangePreferImagesFirst={onChangePreferImagesFirst}
                onChangeReadyLevelFilter={onChangeReadyLevelFilter}
                onChangeReadyAdaptationEnabled={onChangeReadyAdaptationEnabled}
                onChangeReadySummaryEnabled={onChangeReadySummaryEnabled}
              />
            </>
          </View>
        </Animated.View>
        <Animated.View style={[styles.sheetHeader, animatedHeaderStyle]}>
          <Pressable
            style={styles.sheetHeaderButton}
            onPress={onToggleFiltersCollapsed}
          >
            <View style={styles.sheetTitleRow}>
              <ThemedText type="bodyStrong" style={{ color: textColor }}>
                {isFiltersCollapsed
                  ? t('articles.showFilters')
                  : t('articles.hideFilters')}
              </ThemedText>
              <Ionicons
                color={mutedTextColor}
                name={isFiltersCollapsed ? 'chevron-down' : 'chevron-up'}
                size={16}
              />
            </View>
          </Pressable>
        </Animated.View>
      </Animated.View>

      <View style={styles.resultsRow}>
        <View style={styles.resultsStatus}>
          <ThemedText type="body" style={{ color: mutedTextColor }}>
            {personalFilter !== null
              ? t('articles.personalResults', { count: resultCount })
              : isSearchActive
                ? t('articles.searchResults', { count: resultCount })
                : t('articles.randomResults', { count: resultCount })}
          </ThemedText>
          {isRefreshingResults ? (
            <ActivityIndicator color={tintColor} size="small" />
          ) : null}
          {hasActiveFilters ? (
            <ThemedText type="body" style={{ color: mutedTextColor }}>
              {t('articles.activeFiltersCount', { count: activeFiltersCount })}
            </ThemedText>
          ) : null}
        </View>

        {hasActiveFilters ? (
          <Pressable
            onPress={onClearFilters}
            style={({ pressed }) => [
              styles.clearButton,
              {
                backgroundColor: cardColor,
                borderColor,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <View style={styles.clearButtonContent}>
              <Ionicons
                color={clearIconColor}
                name="close-circle-outline"
                size={16}
              />
              <ThemedText type="bodyStrong" style={{ color: mutedTextColor }}>
                {t('articles.clearFilters')}
              </ThemedText>
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
