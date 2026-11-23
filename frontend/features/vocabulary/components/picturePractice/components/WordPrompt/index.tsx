import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { createStyles } from './styles';

type WordPromptProps = {
  word: string;
};

export function WordPrompt({ word }: WordPromptProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <ThemedText type="description" style={styles.centeredText}>
        {t('vocabulary.practice.choosePicture')}
      </ThemedText>
      <ThemedText
        type="heroTitle"
        accessibilityLanguage="en-US"
        style={styles.centeredText}
      >
        {word}
      </ThemedText>
    </View>
  );
}
