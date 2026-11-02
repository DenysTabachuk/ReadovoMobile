import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '@/components/themedText';
import type { AchievementProgress } from '@/features/achievements';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { styles } from './styles';

type ProfileStatsProps = {
  progress: AchievementProgress;
  achievementsCount: number;
  currentStreak: number;
};

export function ProfileStats({
  progress,
  achievementsCount,
  currentStreak,
}: ProfileStatsProps) {
  const { t } = useTranslation();
  const isDarkTheme = useColorScheme() === 'dark';
  const stats = [
    {
      labelKey: 'profile.stats.words',
      value: progress.wordsLearned,
      icon: 'library-outline',
      color: '#7d4ef6',
    },
    {
      labelKey: 'profile.stats.tests',
      value: progress.testsCompleted,
      icon: 'checkmark-circle-outline',
      color: '#2c9d49',
    },
    {
      labelKey: 'profile.stats.achievements',
      value: achievementsCount,
      icon: 'trophy-outline',
      color: '#2f80ed',
    },
    {
      labelKey: 'profile.stats.streak',
      value: currentStreak,
      icon: 'flame',
      color: '#f2994a',
    },
  ] as const;

  return (
    <View style={[styles.statsCard, isDarkTheme ? styles.statsCardDark : null]}>
      {stats.map(({ labelKey, value, icon, color }) => (
        <View key={labelKey} style={styles.statItem}>
          <View style={styles.statValueRow}>
            <ThemedText style={styles.statValue}>{value}</ThemedText>
            <Ionicons color={color} name={icon} size={18} />
          </View>
          <View style={styles.statMetaRow}>
            <ThemedText style={styles.statLabel}>{t(labelKey)}</ThemedText>
          </View>
        </View>
      ))}
    </View>
  );
}
