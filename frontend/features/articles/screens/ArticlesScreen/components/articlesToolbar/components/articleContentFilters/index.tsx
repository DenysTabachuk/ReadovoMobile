import { useTheme } from '@/hooks/use-theme';
import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { createStyles as createSharedStyles } from '../../styles';

import { OptionPickerField } from '@/components/optionPickerField';
import { ThemedText } from '@/components/themedText';

import type { ArticlesToolbarProps } from '../../types';
import { ARTICLE_CATEGORY_OPTIONS } from './constants';
type Props = Pick<
  ArticlesToolbarProps,
  | 'categoryFilter'
  | 'personalFilter'
  | 'onChangeCategoryFilter'
  | 'sortByFilter'
  | 'onChangeSortByFilter'
>;
export function ArticleContentFilters({
  categoryFilter,
  personalFilter,
  onChangeCategoryFilter,
  sortByFilter,
  onChangeSortByFilter,
}: Props) {
  const { colors } = useTheme();
  const sharedStyles = useMemo(() => createSharedStyles(colors), [colors]);
  const { t } = useTranslation();

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
  return (
    <>
      <View style={[sharedStyles.sectionCard, sharedStyles.filterSurface]}>
        <View style={sharedStyles.sectionHeader}>
          <ThemedText
            type="body"
            style={[sharedStyles.sectionHeaderText, sharedStyles.mutedText]}
          >
            {t('articles.filtersSections.main')}
          </ThemedText>
        </View>

        <View style={sharedStyles.categorySection}>
          <ThemedText type="bodyStrong">
            {t('articles.categoryLabel')}
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={sharedStyles.categoryList}
          >
            {ARTICLE_CATEGORY_OPTIONS.map((option) => {
              const isSelected =
                personalFilter === null && option.value === categoryFilter;
              const categoryColor = isSelected
                ? colors.onSelection
                : option.iconColor;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={option.value}
                  onPress={() => onChangeCategoryFilter(option.value)}
                  style={({ pressed }) => [
                    sharedStyles.categoryChip,
                    sharedStyles.controlSurface,
                    isSelected ? sharedStyles.selectedCategoryChip : null,
                    pressed ? sharedStyles.chipPressed : null,
                  ]}
                >
                  <Ionicons
                    color={categoryColor}
                    name={option.icon}
                    size={18}
                  />
                  <ThemedText
                    numberOfLines={1}
                    type="bodyStrong"
                    style={[
                      sharedStyles.categoryChipLabel,
                      isSelected
                        ? sharedStyles.selectedCategoryText
                        : sharedStyles.mutedText,
                    ]}
                  >
                    {t(option.labelKey)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={sharedStyles.filtersRow}>
          <View style={sharedStyles.pickerField}>
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
    </>
  );
}
