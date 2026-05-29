import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { ThemedText } from '@/components/themedText';
import { type StreakAchievement } from '@/features/streak';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { styles } from './styles';

type StreakAchievementCardProps = {
  achievement: StreakAchievement;
  progressValue: number;
};

export function StreakAchievementCard({ achievement, progressValue }: StreakAchievementCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isUnlocked = achievement.isUnlocked;
  const ratio = Math.min(progressValue / achievement.milestone, 1);

  return (
    <View
      style={[
        styles.card,
        isUnlocked
          ? (isDark ? styles.unlockedCardDark : styles.unlockedCardLight)
          : (isDark ? styles.lockedCardDark : styles.lockedCardLight),
      ]}>
      <View style={styles.titleRow}>
        <Ionicons
          color="#f2bf4a"
          name={isDark ? 'trophy-outline' : 'trophy'}
          size={16}
        />
        <ThemedText type="bodyStrong" style={[styles.title, isDark ? styles.titleDark : styles.titleLight]}>
          {achievement.milestone} днів
        </ThemedText>
      </View>
      <ThemedText style={[styles.status, isDark ? styles.statusDark : styles.statusLight]}>{isUnlocked ? 'Отримано' : 'Заблоковано'}</ThemedText>
      <View style={[styles.progressTrack, isDark ? styles.progressTrackDark : styles.progressTrackLight]}>
        <View style={[styles.progressFill, { width: `${Math.round(ratio * 100)}%` }]} />
      </View>
      <ThemedText style={[styles.progressText, isDark ? styles.progressTextDark : styles.progressTextLight]}>
        {Math.min(progressValue, achievement.milestone)}/{achievement.milestone}
      </ThemedText>
      <ThemedText style={styles.reward}>+{achievement.rewardCoins} монет</ThemedText>
    </View>
  );
}
