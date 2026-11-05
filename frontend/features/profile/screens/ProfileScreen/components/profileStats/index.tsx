import { useMemo } from 'react';
import { palette } from '@/constants/palette';
import { useTheme } from '@/hooks/use-theme';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '@/components/themedText';
import type { AchievementProgress } from '@/features/achievements';
import { createStyles } from './styles';

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();
  const stats = [
    {
      labelKey: 'profile.stats.words',
      value: progress.wordsLearned,
      icon: 'library-outline',
      color: palette.purple500,
    },
    {
      labelKey: 'profile.stats.tests',
      value: progress.testsCompleted,
      icon: 'checkmark-circle-outline',
      color: palette.green500,
    },
    {
      labelKey: 'profile.stats.achievements',
      value: achievementsCount,
      icon: 'trophy-outline',
      color: palette.blue500,
    },
    {
      labelKey: 'profile.stats.streak',
      value: currentStreak,
      icon: 'flame',
      color: palette.orange500,
    },
  ] as const;

  return (
    <View style={[styles.statsCard]}>
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
