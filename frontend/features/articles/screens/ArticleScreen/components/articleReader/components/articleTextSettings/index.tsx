import { Button } from '@/components/button';
import { ModalSheet } from '@/components/modalSheet';
import { OptionPickerField } from '@/components/optionPickerField';
import { SegmentedToggle } from '@/components/segmentedToggle';
import { ThemedText } from '@/components/themedText';
import type { ArticleTextTransformationType } from '@/features/articles/api';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { useArticleTransformations } from '../../../../hooks/useArticleTransformations';
import type { ArticleTextViewMode } from '../../../../types';
import { styles } from './styles';
import { createArticleLevelOptions } from './utils/createArticleLevelOptions';
import { createArticleTextModeOptions } from './utils/createArticleTextModeOptions';
type Props = {
  transformations: ReturnType<typeof useArticleTransformations>;
  open: boolean;
  onClose: () => void;
};

const TEXT_MODE_LABEL_KEYS: Record<
  ArticleTextViewMode,
  'original' | 'adapted' | 'summary'
> = { adaptation: 'adapted', original: 'original', summary: 'summary' };

export function ArticleTextSettings({ transformations, open, onClose }: Props) {
  const { t } = useTranslation();
  const {
    selectedTextViewMode,
    selectedLevel,
    handleLevelChange,
    handleTextViewModeChange,
    availableAdaptations,
    isSelectedAdaptationAvailable,
    isSelectedSummaryAvailable,
    isGenerating,
    pendingTransformationType,
    generateTransformation,
  } = transformations;
  const handleGenerate = (type: ArticleTextTransformationType) => {
    onClose();
    generateTransformation(type);
  };
  const levelOptions = useMemo(
    () => createArticleLevelOptions(availableAdaptations, t),
    [availableAdaptations, t],
  );
  const generatedTextModeOptions = useMemo(
    () =>
      createArticleTextModeOptions(
        {
          adaptation: isSelectedAdaptationAvailable,
          summary: isSelectedSummaryAvailable,
        },
        t,
      ),
    [isSelectedAdaptationAvailable, isSelectedSummaryAvailable, t],
  );
  const adaptationReadyBorderColor = useThemeColor(
    { dark: '#2b6f43', light: '#9dddb7' },
    'icon',
  );
  const adaptationReadyTextColor = useThemeColor(
    { dark: '#7ee0a0', light: '#1f8a4c' },
    'text',
  );
  return (
    <ModalSheet
      contentStyle={styles.adaptModalContent}
      onClose={onClose}
      open={open}
      title={t('article.configureText')}
    >
      {generatedTextModeOptions.length > 1 ? (
        <View style={styles.textModeSection}>
          <ThemedText type="description" style={styles.textModeCaption}>
            {t(
              `article.textMode.${TEXT_MODE_LABEL_KEYS[selectedTextViewMode]}`,
            )}
          </ThemedText>
          <SegmentedToggle
            onChange={handleTextViewModeChange}
            options={generatedTextModeOptions}
            selectedValue={selectedTextViewMode}
          />
        </View>
      ) : null}
      <View style={styles.adaptModalFields}>
        <View style={styles.adaptModalPickerField}>
          <OptionPickerField
            label={t('article.levelLabel')}
            onSelect={handleLevelChange}
            options={levelOptions}
            selectedValue={selectedLevel}
            title={t('article.levelPickerTitle')}
          />
        </View>
      </View>
      {isSelectedAdaptationAvailable || isSelectedSummaryAvailable ? (
        <View
          style={[
            styles.readyStatusList,
            { borderColor: adaptationReadyBorderColor },
          ]}
        >
          {isSelectedAdaptationAvailable ? (
            <View style={styles.readyStatusItem}>
              <Ionicons
                color={adaptationReadyTextColor}
                name="sparkles-outline"
                size={16}
              />
              <ThemedText
                type="description"
                style={{ color: adaptationReadyTextColor }}
              >
                {t('article.readyAdaptedShort')}
              </ThemedText>
            </View>
          ) : null}
          {isSelectedSummaryAvailable ? (
            <View style={styles.readyStatusItem}>
              <Ionicons
                color={adaptationReadyTextColor}
                name="document-text-outline"
                size={16}
              />
              <ThemedText
                type="description"
                style={{ color: adaptationReadyTextColor }}
              >
                {t('article.readySummaryShort')}
              </ThemedText>
            </View>
          ) : null}
        </View>
      ) : null}
      <View style={styles.textActionButtons}>
        {!isSelectedAdaptationAvailable ? (
          <Button
            disabled={isGenerating}
            onPress={() => handleGenerate('adaptation')}
            variant={isSelectedSummaryAvailable ? 'secondary' : 'primary'}
          >
            {isGenerating && pendingTransformationType === 'adaptation'
              ? t('article.adapting')
              : t('article.adaptText')}
          </Button>
        ) : null}
        {!isSelectedSummaryAvailable ? (
          <Button
            disabled={isGenerating}
            onPress={() => handleGenerate('summary')}
            variant="secondary"
          >
            {isGenerating && pendingTransformationType === 'summary'
              ? t('article.summarizing')
              : t('article.summarizeText')}
          </Button>
        ) : null}
      </View>
    </ModalSheet>
  );
}
