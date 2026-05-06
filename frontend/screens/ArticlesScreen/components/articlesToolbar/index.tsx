import { Ionicons } from '@expo/vector-icons';
import { type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { OptionPickerField } from '@/components/optionPickerField';
import { ThemedText } from '@/components/themedText';
import { useThemeColor } from '@/hooks/use-theme-color';

import { styles } from './styles';

export type ArticlePreviewLengthFilter = 'all' | 'short' | 'medium' | 'long';
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
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: ArticleCategoryFilter;
};

type ArticlesToolbarProps = {
  categoryFilter: ArticleCategoryFilter;
  isRefreshingResults: boolean;
  isSearchActive: boolean;
  previewLengthFilter: ArticlePreviewLengthFilter;
  recommendedArticles: boolean;
  resultCount: number;
  searchValue: string;
  onChangeCategoryFilter: (value: ArticleCategoryFilter) => void;
  onChangePreviewLengthFilter: (value: ArticlePreviewLengthFilter) => void;
  onChangeRecommendedArticles: (value: boolean) => void;
  onChangeSearchValue: (value: string) => void;
  onClearFilters: () => void;
};

export function ArticlesToolbar({
  categoryFilter,
  isRefreshingResults,
  isSearchActive,
  previewLengthFilter,
  recommendedArticles,
  resultCount,
  searchValue,
  onChangeCategoryFilter,
  onChangePreviewLengthFilter,
  onChangeRecommendedArticles,
  onChangeSearchValue,
  onClearFilters,
}: ArticlesToolbarProps) {
  const { t } = useTranslation();
  const borderColor = useThemeColor({ light: '#d0d7de', dark: '#2d3336' }, 'text');
  const cardColor = useThemeColor({ light: '#f5f7fa', dark: '#202425' }, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({ light: '#7c7c7c', dark: '#a8a8a8' }, 'icon');
  const mutedTextColor = useThemeColor({ light: '#687076', dark: '#9ba1a6' }, 'icon');
  const selectedCategoryBackground = useThemeColor(
    { light: '#e8f5f9', dark: '#123847' },
    'background',
  );
  const hasActiveFilters =
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
      icon: 'sparkles-outline',
      label: t('articles.filters.category.all'),
      value: 'all',
    },
    {
      icon: 'planet-outline',
      label: t('articles.filters.category.space'),
      value: 'space',
    },
    {
      icon: 'football-outline',
      label: t('articles.filters.category.sports'),
      value: 'sports',
    },
    {
      icon: 'restaurant-outline',
      label: t('articles.filters.category.food'),
      value: 'food',
    },
    {
      icon: 'map-outline',
      label: t('articles.filters.category.geography'),
      value: 'geography',
    },
    {
      icon: 'person-outline',
      label: t('articles.filters.category.biography'),
      value: 'biography',
    },
    {
      icon: 'time-outline',
      label: t('articles.filters.category.history'),
      value: 'history',
    },
    {
      icon: 'flask-outline',
      label: t('articles.filters.category.science'),
      value: 'science',
    },
    {
      icon: 'hardware-chip-outline',
      label: t('articles.filters.category.technology'),
      value: 'technology',
    },
    {
      icon: 'leaf-outline',
      label: t('articles.filters.category.nature'),
      value: 'nature',
    },
    {
      icon: 'color-palette-outline',
      label: t('articles.filters.category.culture'),
      value: 'culture',
    },
  ];

  return (
    <View style={styles.container}>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        onChangeText={onChangeSearchValue}
        placeholder={t('articles.searchPlaceholder')}
        placeholderTextColor={placeholderColor}
        returnKeyType="search"
        selectionColor={tintColor}
        style={[
          styles.searchInput,
          {
            borderColor,
            color: textColor,
          },
        ]}
        value={searchValue}
      />

      <View
        style={[
          styles.recommendedToggle,
          {
            backgroundColor: cardColor,
            borderColor,
          },
        ]}>
        <View style={styles.recommendedToggleLabel}>
          <Ionicons color={tintColor} name="sparkles-outline" size={20} />
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

      <View style={styles.categorySection}>
        <ThemedText type="bodyStrong">
          {t('articles.categoryLabel')}
        </ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}>
          {categoryOptions.map((option) => {
            const isSelected = option.value === categoryFilter;
            const categoryColor = isSelected ? tintColor : mutedTextColor;

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
                    borderColor: isSelected ? tintColor : borderColor,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}>
                <Ionicons color={categoryColor} name={option.icon} size={18} />
                <ThemedText
                  numberOfLines={1}
                  type="bodyStrong"
                  style={[styles.categoryChipLabel, { color: categoryColor }]}>
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
            {isSearchActive
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
