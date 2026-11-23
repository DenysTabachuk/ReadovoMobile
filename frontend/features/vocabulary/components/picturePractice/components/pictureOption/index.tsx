import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ImageWithFallback } from '@/components/imageWithFallback';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import type { VocabularyPracticeOption } from '@/api/generated/transport';
import { PracticeOption } from '../../../PracticeOption';
import type { PracticeOptionInteractionProps } from '../../../PracticeOption/types';
import { createStyles } from './styles';

type PictureOptionProps = PracticeOptionInteractionProps & {
  option: VocabularyPracticeOption;
  position: number;
};

export function PictureOption({
  option,
  position,
  ...optionProps
}: PictureOptionProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const label = t('vocabulary.practice.pictureNumber', { number: position });

  return (
    <PracticeOption
      accessibilityLabel={label}
      {...optionProps}
      style={styles.option}
      iconSize={28}
    >
      {(outcomeIcon) => (
        <>
          <View style={styles.picture}>
            <ImageWithFallback
              style={styles.image}
              contentFit="contain"
              accessible={false}
            />
          </View>
          <View style={styles.label}>
            <ThemedText type="bodyStrong">
              {optionProps.checked ? option.word : label}
            </ThemedText>
            {outcomeIcon}
          </View>
        </>
      )}
    </PracticeOption>
  );
}
