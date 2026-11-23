import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { useVocabularySpeech } from '../../../../hooks/useVocabularySpeech';
import { createStyles } from './styles';

type AudioPromptProps = { questionId: string; word: string };

export function AudioPrompt({ questionId, word }: AudioPromptProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { speakingText, hasSpeechError, pronounce } =
    useVocabularySpeech(questionId);
  useFocusEffect(
    useCallback(() => {
      void pronounce(word);
    }, [pronounce, questionId, word]),
  );
  const label = t('vocabulary.audio.listenAgain');

  return (
    <View style={styles.prompt}>
      <ThemedText type="description">
        {t('vocabulary.audio.choosePicture')}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ busy: speakingText !== null }}
        onPress={() => {
          void pronounce(word);
        }}
        style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}
      >
        <View style={styles.playIcon}>
          <Ionicons
            name="volume-high"
            size={36}
            color={colors.onPrimary}
            accessible={false}
          />
        </View>
        <ThemedText type="buttonLabel" style={styles.playLabel}>
          {label}
        </ThemedText>
      </Pressable>
      {hasSpeechError && (
        <ThemedText accessibilityRole="alert" style={styles.error}>
          {t('vocabulary.cards.speechUnavailable')}
        </ThemedText>
      )}
    </View>
  );
}
