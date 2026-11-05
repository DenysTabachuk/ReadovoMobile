import { useMemo } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  View,
  type DimensionValue,
  type GestureResponderEvent,
} from 'react-native';

import { ThemedText } from '@/components/themedText';
import type { DictionaryWord } from '../../../../api/types';

import { getProgressLabel } from './utils/getProgressLabel';
import { createStyles } from './styles';
import { ProgressMenu } from './components/progressMenu';

type DictionaryWordCardProps = {
  word: DictionaryWord;
  isProgressMenuOpen: boolean;
  isUpdatingProgress: boolean;
  onOpenWord: (word: DictionaryWord) => void;
  onToggleProgressMenu: (wordId: string) => void;
  onMoveBackToInProgress: (wordId: string) => void;
};

export function DictionaryWordCard({
  word,
  isProgressMenuOpen,
  isUpdatingProgress,
  onOpenWord,
  onToggleProgressMenu,
  onMoveBackToInProgress,
}: DictionaryWordCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, word.progress),
    [colors, word.progress],
  );

  const progressRatio = Math.min(
    word.correctAnswersCount / word.requiredCorrectAnswers,
    1,
  );
  const progressPercentage: DimensionValue = `${Math.round(progressRatio * 100)}%`;

  const handleProgressPress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onToggleProgressMenu(word.id);
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onOpenWord(word)}
      style={styles.wordCard}
    >
      <View style={styles.cardHeader}>
        <View style={styles.wordTitleGroup}>
          <ThemedText type="sectionTitle" style={styles.wordText}>
            {word.word}
          </ThemedText>
          <ThemedText type="body" style={styles.wordPreviewText}>
            {word.translation}
          </ThemedText>
        </View>
        <View style={styles.progressControl}>
          <Pressable
            disabled={word.progress !== 'learned'}
            onPress={handleProgressPress}
            style={[styles.progressBadge]}
          >
            <ThemedText type="bodyStrong" style={styles.progressText}>
              {getProgressLabel(word.progress, t)}
            </ThemedText>
          </Pressable>
          {isProgressMenuOpen ? (
            <ProgressMenu
              wordId={word.id}
              isUpdatingProgress={isUpdatingProgress}
              onMoveBackToInProgress={onMoveBackToInProgress}
            />
          ) : null}
        </View>
      </View>
      <View style={styles.learningProgressBlock}>
        <View style={styles.learningProgressTrack}>
          <View
            style={[styles.learningProgressFill, { width: progressPercentage }]}
          />
        </View>
        <ThemedText style={styles.learningProgressText}>
          {`${Math.min(word.correctAnswersCount, word.requiredCorrectAnswers)}/${word.requiredCorrectAnswers}`}
        </ThemedText>
      </View>
      <View style={styles.cardTapHint}>
        <Ionicons color={colors.textSecondary} name="open-outline" size={13} />
        <ThemedText type="description" style={styles.cardTapHintText}>
          {t('dictionary.tapHint')}
        </ThemedText>
      </View>
    </Pressable>
  );
}
