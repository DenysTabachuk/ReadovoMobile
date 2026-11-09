import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themedText';
import { ImageWithFallback } from '@/components/imageWithFallback';
import { useTheme } from '@/hooks/use-theme';
import type { VocabularyWordCard } from '../../../../fixtures/wordCards';
import { useVocabularySpeech } from '../../../../hooks/useVocabularySpeech';
import { createStyles } from './styles';

type WordCardProps = { card: VocabularyWordCard };

export function WordCard({ card }: WordCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { speakingText, hasSpeechError, pronounce } = useVocabularySpeech(
    card.id,
  );

  return (
    <View style={styles.card}>
      <View style={styles.imagePanel}>
        <ImageWithFallback
          source={card.image}
          contentFit="contain"
          style={styles.image}
          accessible={false}
        />
      </View>
      <View style={styles.details}>
        <View style={styles.wordRow}>
          <View style={styles.wordText}>
            <ThemedText type="screenTitle" accessibilityLanguage="en-US">
              {card.word}
            </ThemedText>
            <ThemedText type="description" style={styles.secondary}>
              {card.transcription}
            </ThemedText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('vocabulary.cards.pronounceWord', {
              word: card.word,
            })}
            accessibilityState={{ busy: speakingText === card.word }}
            onPress={() => void pronounce(card.word)}
            style={({ pressed }) => [
              styles.audioButton,
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons
              name="volume-up"
              size={28}
              color={colors.onPrimary}
            />
          </Pressable>
        </View>
        <View style={styles.translation}>
          <ThemedText type="bodyStrong" style={styles.languageBadge}>
            {t('vocabulary.cards.translationLanguage')}
          </ThemedText>
          <ThemedText type="sectionTitle" accessibilityLanguage="uk">
            {t(card.translationKey)}
          </ThemedText>
        </View>
        <View style={styles.example}>
          <View style={styles.wordRow}>
            <ThemedText
              type="bodyStrong"
              style={styles.exampleText}
              accessibilityLanguage="en-US"
            >
              {card.example}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('vocabulary.cards.pronounceExample')}
              accessibilityState={{ busy: speakingText === card.example }}
              onPress={() => void pronounce(card.example)}
              style={({ pressed }) => [
                styles.exampleAudio,
                pressed && styles.pressed,
              ]}
            >
              <MaterialIcons
                name="volume-up"
                size={24}
                color={colors.interactive}
              />
            </Pressable>
          </View>
          <ThemedText style={styles.secondary} accessibilityLanguage="uk">
            {t(card.exampleTranslationKey)}
          </ThemedText>
        </View>
        {hasSpeechError && (
          <ThemedText accessibilityRole="alert" style={styles.error}>
            {t('vocabulary.cards.speechUnavailable')}
          </ThemedText>
        )}
      </View>
    </View>
  );
}
