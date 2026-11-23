import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';

import { LearningArtwork } from '@/features/learningMedia';
import { ThemedText } from '@/components/themedText';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import type { VocabularyPracticeOption } from '@/api/generated/transport';
import { PracticeOption } from '../../../PracticeOption';
import type { PracticeOptionInteractionProps } from '../../../PracticeOption/types';
import { SpoilerPlaceholder } from './components/SpoilerPlaceholder';
import { createStyles } from './styles';

type PictureOptionProps = PracticeOptionInteractionProps & {
  option: VocabularyPracticeOption;
  position: number;
};

const OUTCOME_ICON_SIZE = 28;
const PICTURE_LABEL_LINES = 2;
const LABEL_REVEAL_DELAY_MS = 125;
const LABEL_REVEAL_DURATION_MS = 180;
const revealLabel = FadeIn.delay(LABEL_REVEAL_DELAY_MS)
  .duration(LABEL_REVEAL_DURATION_MS)
  .reduceMotion(ReduceMotion.System);

export function PictureOption({
  option,
  position,
  ...optionProps
}: PictureOptionProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const labelHeight = Math.max(
    OUTCOME_ICON_SIZE,
    Math.ceil(
      Typography.bodyStrong.lineHeight * PICTURE_LABEL_LINES * fontScale,
    ),
  );
  const styles = useMemo(
    () => createStyles(colors, labelHeight),
    [colors, labelHeight],
  );
  const label = optionProps.checked
    ? option.word
    : t('vocabulary.practice.pictureNumber', { number: position });

  return (
    <PracticeOption
      accessibilityLabel={label}
      accessibilityLanguage={optionProps.checked ? 'en-US' : undefined}
      {...optionProps}
      style={styles.option}
      iconSize={OUTCOME_ICON_SIZE}
    >
      {(outcomeIcon) => (
        <>
          <LearningArtwork
            style={styles.image}
            contentFit="contain"
            imageUrl={option.imageUrl}
          />
          <View style={styles.labelSlot}>
            <SpoilerPlaceholder revealed={optionProps.checked} />
            {optionProps.checked && (
              <Animated.View
                key="label"
                entering={revealLabel}
                style={styles.label}
              >
                <ThemedText
                  type="bodyStrong"
                  numberOfLines={PICTURE_LABEL_LINES}
                  style={styles.word}
                >
                  {option.word}
                </ThemedText>
                {outcomeIcon}
              </Animated.View>
            )}
          </View>
        </>
      )}
    </PracticeOption>
  );
}
