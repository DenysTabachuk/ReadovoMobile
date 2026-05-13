import { Ionicons } from '@expo/vector-icons';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
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
  onToggleFilters?: (isCollapsed: boolean) => void;
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
};

export function ArticlesToolbar({
  categoryFilter,
  personalFilter,
  isRefreshingResults,
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
  onToggleFilters,
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
}: ArticlesToolbarProps) {
  const { t } = useTranslation();
  const [isRecommendedInfoOpen, setIsRecommendedInfoOpen] = useState(false);
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);
  const [filtersContentHeight, setFiltersContentHeight] = useState(0);
  const collapseProgress = useRef(new Animated.Value(1)).current;
  const opacityProgress = useRef(new Animated.Value(1)).current;
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const borderColor = useThemeColor({ light: '#d0d7de', dark: '#2d3336' }, 'text');
  const cardColor = useThemeColor({ light: '#f5f7fa', dark: '#202425' }, 'background');
  const sectionCardColor = useThemeColor(
    { light: '#edf1f5', dark: '#171c1d' },
    'background',
  );
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({ light: '#7c7c7c', dark: '#a8a8a8' }, 'icon');
  const mutedTextColor = useThemeColor({ light: '#687076', dark: '#9ba1a6' }, 'icon');
  const darkFilterIconColor = '#a5b4fc';
  const clearIconColor = isDarkMode ? darkFilterIconColor : tintColor;
  const savedAccentColor = isDarkMode ? '#c4a7ff' : tintColor;
  const selectedCategoryBackground = useThemeColor(
    { light: '#e8f5f9', dark: '#2a2141' },
    'background',
  );
  const selectedCategoryColor = isDarkMode ? '#d9c7ff' : tintColor;
  const hasReadyTransformationFilter =
    readyAdaptationEnabled || readySummaryEnabled;
  const activeFiltersCount =
    Number(personalFilter !== null) +
    Number(searchValue.trim().length > 0) +
    Number(preferImagesFirst) +
    Number(readyLevelFilter !== 'all') +
    Number(hasReadyTransformationFilter) +
    Number(sortByFilter !== 'default') +
    Number(categoryFilter !== 'all') +
    Number(!recommendedArticles);
  const hasActiveFilters = activeFiltersCount > 0;
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
  const sortOptions = [
    { label: t('articles.filters.sort.default'), value: 'default' as const },
    {
      label: t('articles.filters.sort.lengthDesc'),
      value: 'length_desc' as const,
    },
    {
      label: t('articles.filters.sort.lengthAsc'),
      value: 'length_asc' as const,
    },
  ];
  const readyLevelOptions = [
    { label: t('articles.filters.readyLevel.all'), value: 'all' as const },
    { label: 'A1', value: 'A1' as const },
    { label: 'A2', value: 'A2' as const },
    { label: 'B1', value: 'B1' as const },
    { label: 'B2', value: 'B2' as const },
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
  useEffect(() => {
    Animated.timing(collapseProgress, {
      duration: 300,
      easing: Easing.linear,
      toValue: isFiltersCollapsed ? 0 : 1,
      useNativeDriver: false,
    }).start();
  }, [collapseProgress, isFiltersCollapsed]);
  useEffect(() => {
    Animated.timing(opacityProgress, {
      duration: 200,
      easing: Easing.linear,
      toValue: isFiltersCollapsed ? 0 : 1,
      useNativeDriver: false,
    }).start();
  }, [isFiltersCollapsed, opacityProgress]);

  const animatedContentStyle = useMemo(
    () => ({
      height: collapseProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.max(filtersContentHeight, 1)],
      }),
      opacity: opacityProgress,
    }),
    [collapseProgress, filtersContentHeight, opacityProgress],
  );

  const toggleFilters = useCallback(() => {
    setIsFiltersCollapsed((current) => {
      const next = !current;
      onToggleFilters?.(next);
      return next;
    });
  }, [onToggleFilters]);

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

      <View
        style={[
          styles.sheetContainer,
          isFiltersCollapsed ? styles.sheetContainerCollapsed : null,
          {
            backgroundColor: sectionCardColor,
            borderColor,
          },
        ]}>
        <Animated.View
          pointerEvents={isFiltersCollapsed ? 'none' : 'auto'}
          style={[
            styles.filtersContentAnimated,
            filtersContentHeight > 0 ? animatedContentStyle : null,
          ]}>
          <View
            onLayout={(event) => {
              const nextHeight = Math.ceil(event.nativeEvent.layout.height);
              if (nextHeight > 0 && nextHeight !== filtersContentHeight) {
                setFiltersContentHeight(nextHeight);
              }
            }}>
            <>
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: sectionCardColor,
            borderColor,
          },
        ]}>
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

      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: sectionCardColor,
            borderColor,
          },
        ]}>
        <View style={styles.sectionHeader}>
          <ThemedText
            type="body"
            style={[styles.sectionHeaderText, { color: mutedTextColor }]}>
            {t('articles.filtersSections.personal')}
          </ThemedText>
        </View>

      <View style={styles.categorySection}>
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
      </View>

      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: sectionCardColor,
            borderColor,
          },
        ]}>
        <View style={styles.sectionHeader}>
          <ThemedText
            type="body"
            style={[styles.sectionHeaderText, { color: mutedTextColor }]}>
            {t('articles.filtersSections.main')}
          </ThemedText>
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
            label={t('articles.sortLabel')}
            onSelect={onChangeSortByFilter}
            options={sortOptions}
            selectedValue={sortByFilter}
            title={t('articles.sortTitle')}
          />
        </View>
      </View>
      </View>

      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: sectionCardColor,
            borderColor,
          },
        ]}>
        <View style={styles.sectionHeader}>
          <ThemedText
            type="body"
            style={[styles.sectionHeaderText, { color: mutedTextColor }]}>
            {t('articles.filtersSections.quick')}
          </ThemedText>
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
              color={isDarkMode ? darkFilterIconColor : tintColor}
              name="image-outline"
              size={20}
            />
            <ThemedText type="bodyStrong">
              {t('articles.preferImagesFirstLabel')}
            </ThemedText>
          </View>
          <Switch
            onValueChange={onChangePreferImagesFirst}
            thumbColor={preferImagesFirst ? tintColor : '#f4f3f4'}
            trackColor={{ false: '#767577', true: selectedCategoryBackground }}
            value={preferImagesFirst}
          />
        </View>
      </View>

      <View style={styles.filtersRow}>
        <View style={styles.pickerField}>
          <OptionPickerField
            label={t('articles.readyLevelLabel')}
            onSelect={onChangeReadyLevelFilter}
            options={readyLevelOptions}
            selectedValue={readyLevelFilter}
            title={t('articles.readyLevelTitle')}
          />
        </View>
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
              color={isDarkMode ? darkFilterIconColor : tintColor}
              name="create-outline"
              size={20}
            />
            <ThemedText type="bodyStrong">
              {t('articles.filters.readyTransformation.adaptation')}
            </ThemedText>
          </View>
          <Switch
            onValueChange={onChangeReadyAdaptationEnabled}
            thumbColor={readyAdaptationEnabled ? tintColor : '#f4f3f4'}
            trackColor={{ false: '#767577', true: selectedCategoryBackground }}
            value={readyAdaptationEnabled}
          />
        </View>
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
              color={isDarkMode ? darkFilterIconColor : tintColor}
              name="document-text-outline"
              size={20}
            />
            <ThemedText type="bodyStrong">
              {t('articles.filters.readyTransformation.summary')}
            </ThemedText>
          </View>
          <Switch
            onValueChange={onChangeReadySummaryEnabled}
            thumbColor={readySummaryEnabled ? tintColor : '#f4f3f4'}
            trackColor={{ false: '#767577', true: selectedCategoryBackground }}
            value={readySummaryEnabled}
          />
        </View>
      </View>
      </View>
            </>
          </View>
        </Animated.View>
        <Pressable
          style={[
            styles.sheetHeader,
            isFiltersCollapsed ? styles.sheetHeaderCollapsed : null,
          ]}
          onPress={toggleFilters}>
          <View style={styles.sheetTitleRow}>
            <ThemedText
              type="bodyStrong"
              style={{ color: textColor }}>
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
            ]}>
            <View style={styles.clearButtonContent}>
              <Ionicons color={clearIconColor} name="close-circle-outline" size={16} />
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





