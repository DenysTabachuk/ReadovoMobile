import { useTheme } from '@/hooks/use-theme';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themedText';
import { IconSymbol } from '@/components/iconSymbol';

import { usePronunciation } from './hooks/usePronunciation';
import { createStyles } from './styles';

type PronunciationButtonProps = {
  word?: string;
};

const PRONUNCIATION_ICON_SIZE = 18;

export function PronunciationButton({ word }: PronunciationButtonProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isSpeaking, pronounce } = usePronunciation(word);
  const styles = useMemo(() => createStyles(colors.link), [colors.link]);

  return (
    <Pressable
      accessibilityLabel={t('translation.pronounceAction', {
        word: word ?? t('translation.titleFallback'),
      })}
      disabled={!word}
      onPress={pronounce}
      style={({ pressed }) => [
        styles.button,
        pressed ? styles.buttonPressed : null,
      ]}
    >
      <View style={styles.content}>
        <IconSymbol
          color={colors.link}
          name="speaker.wave.2.fill"
          size={PRONUNCIATION_ICON_SIZE}
        />
        <ThemedText style={styles.label} type="bodyStrong">
          {isSpeaking
            ? t('translation.pronouncing')
            : t('translation.pronounce')}
        </ThemedText>
      </View>
    </Pressable>
  );
}
