import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { ModalSheet } from '@/components/modalSheet';
import { OptionPickerField } from '@/components/optionPickerField';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themedText';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

import { styles } from './styles';

export type ArticlePreviewLengthFilter = 'all' | 'short' | 'medium' | 'long';
export type ArticlePersonalFilter = 'recent' | 'saved' | null;
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

type CategoryOption = {
  darkIconColor: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: ArticleCategoryFilter;
};

type ArticlesToolbarProps = {
  categoryFilter: ArticleCategoryFilter;
  personalFilter: ArticlePersonalFilter;
  isRefreshingResults: boolean;
  isSearchActive: boolean;
  previewLengthFilter: ArticlePreviewLengthFilter;
  recommendedArticles: boolean;
  recentArticlesCount: number;
  resultCount: number;
  savedArticlesCount: number;
  searchValue: string;
  onChangeCategoryFilter: (value: ArticleCategoryFilter) => void;
  onChangePreviewLengthFilter: (value: ArticlePreviewLengthFilter) => void;
  onChangeRecommendedArticles: (value: boolean) => void;
  onChangeSearchValue: (value: string) => void;
  onClearFilters: () => void;
  onChangePersonalFilter: (value: ArticlePersonalFilter) => void;
};

export function ArticlesToolbar({
  categoryFilter,
  personalFilter,
  isRefreshingResults,
  isSearchActive,
  previewLengthFilter,
  recommendedArticles,
  recentArticlesCount,
  resultCount,
  savedArticlesCount,
  searchValue,
  onChangeCategoryFilter,
  onChangePreviewLengthFilter,
  onChangeRecommendedArticles,
  onChangeSearchValue,
  onClearFilters,
  onChangePersonalFilter,
}: ArticlesToolbarProps) {
  const { t } = useTranslation();
  const [isRecommendedInfoOpen, setIsRecommendedInfoOpen] = useState(false);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const borderColor = useThemeColor({ light: '#d0d7de', dark: '#2d3336' }, 'text');
  const cardColor = useThemeColor({ light: '#f5f7fa', dark: '#202425' }, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({ light: '#7c7c7c', dark: '#a8a8a8' }, 'icon');
  const mutedTextColor = useThemeColor({ light: '#687076', dark: '#9ba1a6' }, 'icon');
  const savedAccentColor = isDarkMode ? '#c4a7ff' : tintColor;
  const selectedCategoryBackground = useThemeColor(
    { light: '#e8f5f9', dark: '#2a2141' },
    'background',
  );
  const selectedCategoryColor = isDarkMode ? '#d9c7ff' : tintColor;
  const hasActiveFilters =
    personalFilter !== null ||
    searchValue.trim().length > 0 ||
    previewLengthFilter !== 'all' ||
    categoryFilter !== 'all' ||
    !recommendedArticles;
  const previewLengthOptions = [
    { label: t('articles.filters.previewLength.all'), value: 'all' as const },
    { label: t('articles.filters.previewLength.short'), value: 'short' as const },
    { label: t('articles.filters.previewLength.medium'), value: 'medium' as const },
    { label: t('articles.filters.previewLength.long'), value: 'long' as const },
  ];
  const categoryOptions: CategoryOption[] = [
    {
      darkIconColor: '#c4a7ff',
      icon: 'sparkles-outline',
      label: t('articles.filters.category.all'),
      value: 'all',
    },
    {
      darkIconColor: '#a5b4fc',
      icon: 'planet-outline',
      label: t('articles.filters.category.space'),
      value: 'space',
    },
    {
      darkIconColor: '#f0abfc',
      icon: 'football-outline',
      label: t('articles.filters.category.sports'),
      value: 'sports',
    },
    {
      darkIconColor: '#f9a8d4',
      icon: 'restaurant-outline',
      label: t('articles.filters.category.food'),
      value: 'food',
    },
    {
      darkIconColor: '#93c5fd',
      icon: 'map-outline',
      label: t('articles.filters.category.geography'),
      value: 'geography',
    },
    {
      darkIconColor: '#c4b5fd',
      icon: 'person-outline',
      label: t('articles.filters.category.biography'),
      value: 'biography',
    },
    {
      darkIconColor: '#f5d0fe',
      icon: 'time-outline',
      label: t('articles.filters.category.history'),
      value: 'history',
    },
    {
      darkIconColor: '#86efac',
      icon: 'flask-outline',
      label: t('articles.filters.category.science'),
      value: 'science',
    },
    {
      darkIconColor: '#67e8f9',
      icon: 'hardware-chip-outline',
      label: t('articles.filters.category.technology'),
      value: 'technology',
    },
    {
      darkIconColor: '#bef264',
      icon: 'leaf-outline',
      label: t('articles.filters.category.nature'),
      value: 'nature',
    },
    {
      darkIconColor: '#fbcfe8',
      icon: 'color-palette-outline',
      label: t('articles.filters.category.culture'),
      value: 'culture',
    },
  ];
  const openRecommendedInfo = useCallback(() => {
    setIsRecommendedInfoOpen(true);
  }, []);
  const closeRecommendedInfo = useCallback(() => {
    setIsRecommendedInfoOpen(false);
  }, []);
  const clearSearch = useCallback(() => {
    onChangeSearchValue('');
  }, [onChangeSearchValue]);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.searchInputContainer,
          {
            borderColor,
          },
        ]}>
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
            ]}>
            <Ionicons color={placeholderColor} name="close-circle" size={22} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.recommendedRow}>
        <View
          style={[
            styles.recommendedToggle,
            {
              backgroundColor: cardColor,
              borderColor,
            },
          ]}>
          <View style={styles.recommendedToggleLabel}>
            <Ionicons
              color={isDarkMode ? '#c4a7ff' : tintColor}
              name="sparkles-outline"
              size={20}
            />
            <ThemedText type="bodyStrong">
              {t('articles.recommendedLabel')}
            </ThemedText>
          </View>
          <Switch
            onValueChange={onChangeRecommendedArticles}
            thumbColor={recommendedArticles ? tintColor : '#f4f3f4'}
            trackColor={{ false: '#767577', true: selectedCategoryBackground }}
            value={recommendedArticles}
          />
        </View>
        <Pressable
          accessibilityLabel={t('articles.recommendedInfo.openAction')}
          onPress={openRecommendedInfo}
          style={[
            styles.infoButton,
            {
              backgroundColor: cardColor,
              borderColor,
            },
          ]}>
          <Ionicons
            color={isDarkMode ? '#c4a7ff' : tintColor}
            name="information-circle-outline"
            size={22}
          />
        </Pressable>
      </View>
      <ModalSheet
        contentStyle={styles.recommendedInfoContent}
        onClose={closeRecommendedInfo}
        open={isRecommendedInfoOpen}
        title={t('articles.recommendedInfo.title')}>
        <ThemedText type="body" style={styles.recommendedInfoText}>
          {t('articles.recommendedInfo.description')}
        </ThemedText>
        <Button onPress={closeRecommendedInfo} style={styles.recommendedInfoButton}>
          {t('articles.recommendedInfo.thanks')}
        </Button>
      </ModalSheet>

      <View style={styles.categorySection}>
        <ThemedText type="bodyStrong">
          {t('articles.myArticles.label')}
        </ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('articles.recent.openAction')}
            accessibilityState={{ selected: personalFilter === 'recent' }}
            onPress={() =>
              onChangePersonalFilter(personalFilter === 'recent' ? null : 'recent')
            }
            style={({ pressed }) => [
              styles.categoryChip,
              {
                backgroundColor:
                  personalFilter === 'recent' ? selectedCategoryBackground : cardColor,
                borderColor:
                  personalFilter === 'recent' ? selectedCategoryColor : borderColor,
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <Ionicons
              color={personalFilter === 'recent' ? selectedCategoryColor : mutedTextColor}
              name={personalFilter === 'recent' ? 'eye' : 'eye-outline'}
              size={18}
            />
            <ThemedText
              numberOfLines={1}
              type="bodyStrong"
              style={[
                styles.categoryChipLabel,
                {
                  color:
                    personalFilter === 'recent' ? selectedCategoryColor : mutedTextColor,
                },
              ]}>
              {t('articles.recent.label')}
            </ThemedText>
            <ThemedText
              type="bodyStrong"
              style={[
                styles.savedCount,
                {
                  color:
                    personalFilter === 'recent' ? selectedCategoryColor : mutedTextColor,
                },
              ]}>
              {recentArticlesCount}
            </ThemedText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('articles.saved.openAction')}
            accessibilityState={{ selected: personalFilter === 'saved' }}
            onPress={() =>
              onChangePersonalFilter(personalFilter === 'saved' ? null : 'saved')
            }
            style={({ pressed }) => [
              styles.categoryChip,
              {
                backgroundColor:
                  personalFilter === 'saved' ? selectedCategoryBackground : cardColor,
                borderColor: personalFilter === 'saved' ? savedAccentColor : borderColor,
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <Ionicons
              color={
                personalFilter === 'saved'
                  ? savedAccentColor
                  : isDarkMode
                    ? '#a78bfa'
                    : mutedTextColor
              }
              name={personalFilter === 'saved' ? 'bookmark' : 'bookmark-outline'}
              size={18}
            />
            <ThemedText
              numberOfLines={1}
              type="bodyStrong"
              style={[
                styles.categoryChipLabel,
                { color: personalFilter === 'saved' ? savedAccentColor : mutedTextColor },
              ]}>
              {t('articles.saved.label')}
            </ThemedText>
            <ThemedText
              type="bodyStrong"
              style={[
                styles.savedCount,
                { color: personalFilter === 'saved' ? savedAccentColor : mutedTextColor },
              ]}>
              {savedArticlesCount}
            </ThemedText>
          </Pressable>
        </ScrollView>
      </View>

      <View style={styles.categorySection}>
        <ThemedText type="bodyStrong">
          {t('articles.categoryLabel')}
        </ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}>
          {categoryOptions.map((option) => {
            const isSelected = personalFilter === null && option.value === categoryFilter;
            const categoryColor = isSelected
              ? selectedCategoryColor
              : isDarkMode
                ? option.darkIconColor
                : mutedTextColor;
            const categoryLabelColor = isSelected ? selectedCategoryColor : mutedTextColor;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={option.value}
                onPress={() => onChangeCategoryFilter(option.value)}
                style={({ pressed }) => [
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected
                      ? selectedCategoryBackground
                      : cardColor,
                    borderColor: isSelected ? selectedCategoryColor : borderColor,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}>
                <Ionicons color={categoryColor} name={option.icon} size={18} />
                <ThemedText
                  numberOfLines={1}
                  type="bodyStrong"
                  style={[styles.categoryChipLabel, { color: categoryLabelColor }]}>
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.filtersRow}>
        <View style={styles.pickerField}>
          <OptionPickerField
            label={t('articles.previewLengthLabel')}
            onSelect={onChangePreviewLengthFilter}
            options={previewLengthOptions}
            selectedValue={previewLengthFilter}
            title={t('articles.previewLengthTitle')}
          />
        </View>
      </View>

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
        </View>

        {hasActiveFilters ? (
          <Pressable
            onPress={onClearFilters}
            style={({ pressed }) => [
              styles.clearButton,
              {
                backgroundColor: cardColor,
                opacity: pressed ? 0.72 : 1,
              },
            ]}>
            <ThemedText type="bodyStrong" style={{ color: tintColor }}>
              {t('articles.clearFilters')}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
