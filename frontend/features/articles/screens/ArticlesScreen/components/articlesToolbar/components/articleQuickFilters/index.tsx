import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Switch, View } from 'react-native';
import { styles as sharedStyles } from '../../styles';

import { OptionPickerField } from '@/components/optionPickerField';
import { ThemedText } from '@/components/themedText';

import { useArticlesFilterTheme } from '../../hooks/useArticlesFilterTheme';
import type { ArticlesToolbarProps } from '../../types';
type Props = Pick<
  ArticlesToolbarProps,
  | 'preferImagesFirst'
  | 'readyLevelFilter'
  | 'readyAdaptationEnabled'
  | 'readySummaryEnabled'
  | 'onChangePreferImagesFirst'
  | 'onChangeReadyLevelFilter'
  | 'onChangeReadyAdaptationEnabled'
  | 'onChangeReadySummaryEnabled'
>;
export function ArticleQuickFilters({
  preferImagesFirst,
  readyLevelFilter,
  readyAdaptationEnabled,
  readySummaryEnabled,
  onChangePreferImagesFirst,
  onChangeReadyLevelFilter,
  onChangeReadyAdaptationEnabled,
  onChangeReadySummaryEnabled,
}: Props) {
  const { t } = useTranslation();
  const {
    isDarkMode,
    borderColor,
    cardColor,
    sectionCardColor,
    tintColor,
    mutedTextColor,
    darkFilterIconColor,
    selectedCategoryBackground,
  } = useArticlesFilterTheme();
  const readyLevelOptions = [
    { label: t('articles.filters.readyLevel.all'), value: 'all' as const },
    { label: 'A1', value: 'A1' as const },
    { label: 'A2', value: 'A2' as const },
    { label: 'B1', value: 'B1' as const },
    { label: 'B2', value: 'B2' as const },
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
            {t('articles.filtersSections.quick')}
          </ThemedText>
        </View>

        <View style={sharedStyles.recommendedRow}>
          <View
            style={[
              sharedStyles.recommendedToggle,
              {
                backgroundColor: cardColor,
                borderColor,
              },
            ]}
          >
            <View style={sharedStyles.recommendedToggleLabel}>
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
              trackColor={{
                false: '#767577',
                true: selectedCategoryBackground,
              }}
              value={preferImagesFirst}
            />
          </View>
        </View>

        <View style={sharedStyles.filtersRow}>
          <View style={sharedStyles.pickerField}>
            <OptionPickerField
              label={t('articles.readyLevelLabel')}
              onSelect={onChangeReadyLevelFilter}
              options={readyLevelOptions}
              selectedValue={readyLevelFilter}
              title={t('articles.readyLevelTitle')}
            />
          </View>
        </View>

        <View style={sharedStyles.recommendedRow}>
          <View
            style={[
              sharedStyles.recommendedToggle,
              {
                backgroundColor: cardColor,
                borderColor,
              },
            ]}
          >
            <View style={sharedStyles.recommendedToggleLabel}>
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
              trackColor={{
                false: '#767577',
                true: selectedCategoryBackground,
              }}
              value={readyAdaptationEnabled}
            />
          </View>
        </View>

        <View style={sharedStyles.recommendedRow}>
          <View
            style={[
              sharedStyles.recommendedToggle,
              {
                backgroundColor: cardColor,
                borderColor,
              },
            ]}
          >
            <View style={sharedStyles.recommendedToggleLabel}>
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
              trackColor={{
                false: '#767577',
                true: selectedCategoryBackground,
              }}
              value={readySummaryEnabled}
            />
          </View>
        </View>
      </View>
    </>
  );
}
