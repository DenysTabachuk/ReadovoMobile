import { useMemo } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { ThemedText } from '@/components/themedText';
import { type StreakAchievement } from '../../types';

import { createStyles } from './styles';

type StreakAchievementCardProps = {
  achievement: StreakAchievement;
  progressValue: number;
};

export function StreakAchievementCard({
  achievement,
  progressValue,
}: StreakAchievementCardProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const isUnlocked = achievement.isUnlocked;
  const ratio = Math.min(progressValue / achievement.milestone, 1);

  return (
    <View
      style={[
        styles.card,
        isUnlocked ? styles.unlockedCard : styles.lockedCard,
      ]}
    >
      <View style={styles.titleRow}>
        <Ionicons
          color={colors.warning}
          name={isDark ? 'trophy-outline' : 'trophy'}
          size={16}
        />
        <ThemedText type="bodyStrong" style={[styles.title]}>
          {achievement.milestone} днів
        </ThemedText>
      </View>
      <ThemedText style={[styles.status]}>
        {isUnlocked ? 'Отримано' : 'Заблоковано'}
      </ThemedText>
      <View style={[styles.progressTrack]}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.round(ratio * 100)}%` },
          ]}
        />
      </View>
      <ThemedText style={[styles.progressText]}>
        {Math.min(progressValue, achievement.milestone)}/{achievement.milestone}
      </ThemedText>
      <ThemedText style={styles.reward}>
        +{achievement.rewardCoins} монет
      </ThemedText>
    </View>
  );
}
