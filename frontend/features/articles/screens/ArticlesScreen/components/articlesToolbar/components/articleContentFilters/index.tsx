import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { styles as sharedStyles } from '../../styles';

import { OptionPickerField } from '@/components/optionPickerField';
import { ThemedText } from '@/components/themedText';

import { useArticlesFilterTheme } from '../../hooks/useArticlesFilterTheme';
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
  const { t } = useTranslation();
  const {
    isDarkMode,
    borderColor,
    cardColor,
    sectionCardColor,
    mutedTextColor,
    selectedCategoryBackground,
    selectedCategoryColor,
  } = useArticlesFilterTheme();
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
      <View
        style={[
          sharedStyles.sectionCard,
          {
            backgroundColor: sectionCardColor,
            borderColor,
          },
        ]}
      >
        <View style={sharedStyles.sectionHeader}>
          <ThemedText
            type="body"
            style={[sharedStyles.sectionHeaderText, { color: mutedTextColor }]}
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
                ? selectedCategoryColor
                : isDarkMode
                  ? option.darkIconColor
                  : mutedTextColor;
              const categoryLabelColor = isSelected
                ? selectedCategoryColor
                : mutedTextColor;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={option.value}
                  onPress={() => onChangeCategoryFilter(option.value)}
                  style={({ pressed }) => [
                    sharedStyles.categoryChip,
                    {
                      backgroundColor: isSelected
                        ? selectedCategoryBackground
                        : cardColor,
                      borderColor: isSelected
                        ? selectedCategoryColor
                        : borderColor,
                      opacity: pressed ? 0.75 : 1,
                    },
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
                      { color: categoryLabelColor },
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
