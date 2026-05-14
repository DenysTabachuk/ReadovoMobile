import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themedText';
import { weekDayLabels, type StreakState } from '@/features/streak';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { styles } from './styles';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const progressTarget = streak.nextMilestone;
  const progressRatio = Math.min(streak.currentStreak / progressTarget, 1);

  return (
    <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
      <View style={styles.headerRow}>
        <View>
          <View style={styles.valueRow}>
            <Ionicons color={isDark ? '#f2994a' : '#d97706'} name="flame" size={20} />
            <ThemedText type="sectionTitle" style={[styles.streakValue, isDark ? styles.textOnDark : styles.textOnLight]}>
              {streak.currentStreak}
            </ThemedText>
          </View>
          <ThemedText style={[styles.subtitle, isDark ? styles.subtleOnDark : styles.subtleOnLight]}>днів поспіль</ThemedText>
        </View>
        <ThemedText style={[styles.status, isDark ? styles.statusDark : styles.statusLight]}>{getStatusText(streak)}</ThemedText>
      </View>

      <View style={styles.weekRow}>
        {weekDayLabels.map((label, index) => (
          <View key={label} style={styles.weekItem}>
            <ThemedText style={[styles.weekLabel, isDark ? styles.subtleOnDark : styles.subtleOnLight]}>{label}</ThemedText>
            <View
              style={[
                styles.weekDot,
                isDark ? styles.weekDotDark : styles.weekDotLight,
                index < Math.min(streak.currentStreak, 7) ? styles.weekDotActive : null,
              ]}
            />
          </View>
        ))}
      </View>

      <ThemedText style={[styles.progressText, isDark ? styles.subtleOnDark : styles.subtleOnLight]}>
        До наступного бонусу: {streak.nextBonusInDays} дні
      </ThemedText>

      <View style={styles.progressRow}>
        <ThemedText style={[styles.progressCounter, isDark ? styles.subtleOnDark : styles.subtleOnLight]}>{streak.currentStreak}/{progressTarget}</ThemedText>
        <View style={[styles.progressTrack, isDark ? styles.progressTrackDark : styles.progressTrackLight]}>
          <View style={[styles.progressFill, { width: `${Math.round(progressRatio * 100)}%` }]} />
        </View>
        <Ionicons color="#7d4ef6" name="gift-outline" size={18} />
      </View>

      <Pressable onPress={onPressCta} style={styles.ctaButton}>
        <ThemedText type="bodyStrong" style={styles.ctaText}>{getCtaText(streak)}</ThemedText>
      </Pressable>
    </View>
  );
}
