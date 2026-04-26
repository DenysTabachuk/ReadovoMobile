import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OptionPickerField } from '@/components/optionPickerField';
import { ThemedText } from '@/components/themedText';
import { useThemeColor } from '@/hooks/use-theme-color';

import { styles } from './styles';

export type ArticlePreviewLengthFilter = 'all' | 'short' | 'medium' | 'long';
export type ArticleCategoryFilter =
  | 'all'
  | 'history'
  | 'science'
  | 'technology'
  | 'nature'
  | 'culture';

type ArticlesToolbarProps = {
  categoryFilter: ArticleCategoryFilter;
  isSearchActive: boolean;
  previewLengthFilter: ArticlePreviewLengthFilter;
  resultCount: number;
  searchValue: string;
  onChangeCategoryFilter: (value: ArticleCategoryFilter) => void;
  onChangePreviewLengthFilter: (value: ArticlePreviewLengthFilter) => void;
  onChangeSearchValue: (value: string) => void;
  onClearFilters: () => void;
};

export function ArticlesToolbar({
  categoryFilter,
  isSearchActive,
  previewLengthFilter,
  resultCount,
  searchValue,
  onChangeCategoryFilter,
  onChangePreviewLengthFilter,
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
  const hasActiveFilters =
    searchValue.trim().length > 0 ||
    previewLengthFilter !== 'all' ||
    categoryFilter !== 'all';
  const previewLengthOptions = [
    { label: t('articles.filters.previewLength.all'), value: 'all' as const },
    { label: t('articles.filters.previewLength.short'), value: 'short' as const },
    { label: t('articles.filters.previewLength.medium'), value: 'medium' as const },
    { label: t('articles.filters.previewLength.long'), value: 'long' as const },
  ];
  const categoryOptions = [
    { label: t('articles.filters.category.all'), value: 'all' as const },
    { label: t('articles.filters.category.history'), value: 'history' as const },
    { label: t('articles.filters.category.science'), value: 'science' as const },
    { label: t('articles.filters.category.technology'), value: 'technology' as const },
    { label: t('articles.filters.category.nature'), value: 'nature' as const },
    { label: t('articles.filters.category.culture'), value: 'culture' as const },
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

        <View style={styles.pickerField}>
          <OptionPickerField
            label={t('articles.categoryLabel')}
            onSelect={onChangeCategoryFilter}
            options={categoryOptions}
            selectedValue={categoryFilter}
            title={t('articles.categoryTitle')}
          />
        </View>
      </View>

      <View style={styles.resultsRow}>
        <ThemedText type="body" style={{ color: mutedTextColor }}>
          {isSearchActive
            ? t('articles.searchResults', { count: resultCount })
            : t('articles.randomResults', { count: resultCount })}
        </ThemedText>

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
