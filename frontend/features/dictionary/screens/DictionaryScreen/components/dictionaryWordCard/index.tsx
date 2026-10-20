import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  View,
  type DimensionValue,
  type GestureResponderEvent,
} from 'react-native';

import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { DictionaryWord } from '../../../../api/types';

import { getProgressBadgeColors } from '../../utils/getProgressBadgeColors';
import { getProgressLabel } from './utils/getProgressLabel';
import { styles } from './styles';
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
  const colorScheme = useColorScheme();
  const isDarkTheme = colorScheme === 'dark';
  const borderColor = isDarkTheme ? '#2d3336' : '#d0d7de';
  const progressColors = getProgressBadgeColors(word.progress, colorScheme);
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
      style={[styles.wordCard, { borderColor }]}
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
            style={[
              styles.progressBadge,
              { backgroundColor: progressColors.backgroundColor },
            ]}
          >
            <ThemedText
              type="bodyStrong"
              style={[styles.progressText, { color: progressColors.textColor }]}
            >
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
        <Ionicons
          color={Colors[colorScheme ?? 'light'].icon}
          name="open-outline"
          size={13}
        />
        <ThemedText type="description" style={styles.cardTapHintText}>
          {t('dictionary.tapHint')}
        </ThemedText>
      </View>
    </Pressable>
  );
}
