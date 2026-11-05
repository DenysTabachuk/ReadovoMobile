import { useTheme } from '@/hooks/use-theme';
import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Switch, View } from 'react-native';
import { createStyles as createSharedStyles } from '../../styles';

import { OptionPickerField } from '@/components/optionPickerField';
import { ThemedText } from '@/components/themedText';

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
  const { colors } = useTheme();
  const sharedStyles = useMemo(() => createSharedStyles(colors), [colors]);
  const { t } = useTranslation();

  const readyLevelOptions = [
    { label: t('articles.filters.readyLevel.all'), value: 'all' as const },
    { label: 'A1', value: 'A1' as const },
    { label: 'A2', value: 'A2' as const },
    { label: 'B1', value: 'B1' as const },
    { label: 'B2', value: 'B2' as const },
  ];
  return (
    <>
      <View style={[sharedStyles.sectionCard, sharedStyles.filterSurface]}>
        <View style={sharedStyles.sectionHeader}>
          <ThemedText
            type="body"
            style={[sharedStyles.sectionHeaderText, sharedStyles.mutedText]}
          >
            {t('articles.filtersSections.quick')}
          </ThemedText>
        </View>

        <View style={sharedStyles.recommendedRow}>
          <View
            style={[
              sharedStyles.recommendedToggle,
              sharedStyles.controlSurface,
            ]}
          >
            <View style={sharedStyles.recommendedToggleLabel}>
              <Ionicons
                color={colors.interactive}
                name="image-outline"
                size={20}
              />
              <ThemedText type="bodyStrong">
                {t('articles.preferImagesFirstLabel')}
              </ThemedText>
            </View>
            <Switch
              onValueChange={onChangePreferImagesFirst}
              thumbColor={
                preferImagesFirst ? colors.interactive : colors.surface
              }
              trackColor={{
                false: colors.borderStrong,
                true: colors.selection,
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
              sharedStyles.controlSurface,
            ]}
          >
            <View style={sharedStyles.recommendedToggleLabel}>
              <Ionicons
                color={colors.interactive}
                name="create-outline"
                size={20}
              />
              <ThemedText type="bodyStrong">
                {t('articles.filters.readyTransformation.adaptation')}
              </ThemedText>
            </View>
            <Switch
              onValueChange={onChangeReadyAdaptationEnabled}
              thumbColor={
                readyAdaptationEnabled ? colors.interactive : colors.surface
              }
              trackColor={{
                false: colors.borderStrong,
                true: colors.selection,
              }}
              value={readyAdaptationEnabled}
            />
          </View>
        </View>

        <View style={sharedStyles.recommendedRow}>
          <View
            style={[
              sharedStyles.recommendedToggle,
              sharedStyles.controlSurface,
            ]}
          >
            <View style={sharedStyles.recommendedToggleLabel}>
              <Ionicons
                color={colors.interactive}
                name="document-text-outline"
                size={20}
              />
              <ThemedText type="bodyStrong">
                {t('articles.filters.readyTransformation.summary')}
              </ThemedText>
            </View>
            <Switch
              onValueChange={onChangeReadySummaryEnabled}
              thumbColor={
                readySummaryEnabled ? colors.interactive : colors.surface
              }
              trackColor={{
                false: colors.borderStrong,
                true: colors.selection,
              }}
              value={readySummaryEnabled}
            />
          </View>
        </View>
      </View>
    </>
  );
}
