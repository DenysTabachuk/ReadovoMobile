import { useMemo } from 'react';
import { palette } from '@/constants/palette';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themedText';
import { weekDayLabels } from '../../constants';
import { type StreakState } from '../../types';

import { createStyles } from './styles';

type StreakCardProps = {
  onPressCta?: () => void;
  streak: StreakState;
};

function getStatusText(streak: StreakState): string {
  if (streak.todayStatus === 'completed') {
    return 'Сьогоднішня активність збережена';
  }

  if (streak.todayStatus === 'pending') {
    return 'Виконайте активність сьогодні, щоб не втратити streak!';
  }

  if (streak.todayStatus === 'broken') {
    return 'Відрізок перервано';
  }

  if (streak.todayStatus === 'frozen') {
    return 'Сьогодні захищено freeze-токеном';
  }

  return 'Статус оновлюється';
}

function getCtaText(streak: StreakState): string {
  if (streak.todayStatus === 'completed') {
    return 'Сьогодні виконано';
  }

  if (streak.todayStatus === 'pending') {
    return 'Виконати активність';
  }

  if (streak.todayStatus === 'broken' && streak.brokenStreakInfo?.canRestore) {
    return 'Відновити streak';
  }

  if (streak.todayStatus === 'broken') {
    return 'Почати спочатку';
  }

  return 'Продовжити';
}

export function StreakCard({ streak, onPressCta }: StreakCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const progressTarget = streak.nextMilestone;
  const progressRatio = Math.min(streak.currentStreak / progressTarget, 1);

  return (
    <View style={[styles.card]}>
      <View style={styles.headerRow}>
        <View>
          <View style={styles.valueRow}>
            <Ionicons color={colors.warning} name="flame" size={20} />
            <ThemedText
              type="sectionTitle"
              style={[styles.streakValue, styles.textOn]}
            >
              {streak.currentStreak}
            </ThemedText>
          </View>
          <ThemedText style={[styles.subtitle, styles.subtleOn]}>
            днів поспіль
          </ThemedText>
        </View>
        <ThemedText style={[styles.status]}>{getStatusText(streak)}</ThemedText>
      </View>

      <View style={styles.weekRow}>
        {weekDayLabels.map((label, index) => (
          <View key={label} style={styles.weekItem}>
            <ThemedText style={[styles.weekLabel, styles.subtleOn]}>
              {label}
            </ThemedText>
            <View
              style={[
                styles.weekDot,
                index < Math.min(streak.currentStreak, 7)
                  ? styles.weekDotActive
                  : null,
              ]}
            />
          </View>
        ))}
      </View>

      <ThemedText style={[styles.progressText, styles.subtleOn]}>
        До наступного бонусу: {streak.nextBonusInDays} дні
      </ThemedText>

      <View style={styles.progressRow}>
        <ThemedText style={[styles.progressCounter, styles.subtleOn]}>
          {streak.currentStreak}/{progressTarget}
        </ThemedText>
        <View style={[styles.progressTrack]}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round(progressRatio * 100)}%` },
            ]}
          />
        </View>
        <Ionicons color={palette.purple500} name="gift-outline" size={18} />
      </View>

      <Pressable onPress={onPressCta} style={styles.ctaButton}>
        <ThemedText type="bodyStrong" style={styles.ctaText}>
          {getCtaText(streak)}
        </ThemedText>
      </Pressable>
    </View>
  );
}
