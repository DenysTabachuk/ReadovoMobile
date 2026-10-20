import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themedText';
import { useStreakCalendarMonthQuery } from '../../api';
import { type StreakCalendarDay, type StreakState } from '../../types';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { styles } from './styles';
import { CalendarDay } from './components/calendarDay';
import { createCalendarGrid } from './utils/createCalendarGrid';

type ActivityCalendarProps = {
  isCtaLoading?: boolean;
  onPressCta?: () => void;
  onRequestFreezeDay: (day: StreakCalendarDay) => void;
  serverNow: string;
  streak: StreakState;
};

const weekDayTranslationKeys = [
  'streak.calendar.weekdays.mon',
  'streak.calendar.weekdays.tue',
  'streak.calendar.weekdays.wed',
  'streak.calendar.weekdays.thu',
  'streak.calendar.weekdays.fri',
  'streak.calendar.weekdays.sat',
  'streak.calendar.weekdays.sun',
] as const;

function getStatusTextKey(todayStatus: StreakState['todayStatus']): string {
  if (todayStatus === 'completed') {
    return 'streak.summary.status.completed';
  }

  if (todayStatus === 'pending') {
    return 'streak.summary.status.pending';
  }

  if (todayStatus === 'broken') {
    return 'streak.summary.status.broken';
  }

  if (todayStatus === 'frozen') {
    return 'streak.summary.status.frozen';
  }

  return 'streak.summary.status.default';
}

function getCtaTextKey(streak: StreakState): string {
  if (streak.todayStatus === 'completed') {
    return 'streak.summary.cta.completed';
  }

  if (streak.todayStatus === 'pending') {
    return 'streak.summary.cta.pending';
  }

  if (streak.todayStatus === 'broken' && streak.brokenStreakInfo?.canRestore) {
    return 'streak.summary.cta.restore';
  }

  if (streak.todayStatus === 'broken') {
    return 'streak.summary.cta.restart';
  }

  return 'streak.summary.cta.default';
}

export function ActivityCalendar({
  isCtaLoading = false,
  serverNow,
  streak,
  onPressCta,
  onRequestFreezeDay,
}: ActivityCalendarProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const initialDate = new Date(serverNow);
  const [visibleYear, setVisibleYear] = useState(initialDate.getUTCFullYear());
  const [visibleMonth, setVisibleMonth] = useState(
    initialDate.getUTCMonth() + 1,
  );

  const calendarQuery = useStreakCalendarMonthQuery({
    year: visibleYear,
    month: visibleMonth,
  });

  const monthLabel = calendarQuery.data?.monthLabel ?? '';
  const serverDate = new Date(calendarQuery.data?.serverNow ?? serverNow);
  const canGoForward =
    visibleYear < serverDate.getUTCFullYear() ||
    (visibleYear === serverDate.getUTCFullYear() &&
      visibleMonth < serverDate.getUTCMonth() + 1);

  const gridCells = useMemo(
    () => createCalendarGrid(calendarQuery.data?.days),
    [calendarQuery.data?.days],
  );

  const goPrevMonth = () => {
    if (visibleMonth === 1) {
      setVisibleMonth(12);
      setVisibleYear((year) => year - 1);
      return;
    }

    setVisibleMonth((month) => month - 1);
  };

  const goNextMonth = () => {
    if (!canGoForward) {
      return;
    }

    if (visibleMonth === 12) {
      setVisibleMonth(1);
      setVisibleYear((year) => year + 1);
      return;
    }

    setVisibleMonth((month) => month + 1);
  };

  const canRestore =
    streak.todayStatus === 'broken' &&
    Boolean(streak.brokenStreakInfo?.canRestore);
  const isCtaInteractive = canRestore && Boolean(onPressCta) && !isCtaLoading;

  return (
    <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
      <View style={styles.headerRow}>
        <Pressable onPress={goPrevMonth} style={styles.navButton}>
          <Ionicons
            color={isDark ? '#cbc7df' : '#5b5f76'}
            name="chevron-back"
            size={16}
          />
        </Pressable>
        <ThemedText
          type="bodyStrong"
          style={[
            styles.monthLabel,
            isDark ? styles.titleDark : styles.titleLight,
          ]}
        >
          {monthLabel}
        </ThemedText>
        <Pressable
          disabled={!canGoForward}
          onPress={goNextMonth}
          style={[
            styles.navButton,
            !canGoForward ? styles.navButtonDisabled : null,
          ]}
        >
          <Ionicons
            color={isDark ? '#cbc7df' : '#5b5f76'}
            name="chevron-forward"
            size={16}
          />
        </Pressable>
      </View>

      <View style={styles.weekHeaderRow}>
        {weekDayTranslationKeys.map((key) => (
          <ThemedText
            key={key}
            style={[
              styles.weekHeaderText,
              isDark ? styles.subtitleDark : styles.subtitleLight,
            ]}
          >
            {t(key)}
          </ThemedText>
        ))}
      </View>

      <View style={styles.grid}>
        {gridCells.map((day, index) => (
          <CalendarDay
            key={day?.date ?? `empty-${index}`}
            day={day}
            onRequestFreezeDay={onRequestFreezeDay}
          />
        ))}
      </View>

      <View style={styles.summaryTopRow}>
        <View style={styles.summaryValueRow}>
          <Ionicons
            color={isDark ? '#f2994a' : '#d97706'}
            name="flame"
            size={18}
          />
          <ThemedText
            type="sectionTitle"
            style={[
              styles.summaryValue,
              isDark ? styles.titleDark : styles.titleLight,
            ]}
          >
            {streak.currentStreak}
          </ThemedText>
          <ThemedText
            style={[
              styles.summarySuffix,
              isDark ? styles.subtitleDark : styles.subtitleLight,
            ]}
          >
            {t('streak.summary.daysInRow')}
          </ThemedText>
        </View>
        <ThemedText
          style={[
            styles.summaryStatus,
            isDark ? styles.statusDark : styles.statusLight,
          ]}
        >
          {t(getStatusTextKey(streak.todayStatus))}
        </ThemedText>
      </View>

      <View style={styles.progressRow}>
        <ThemedText
          style={[
            styles.progressCounter,
            isDark ? styles.subtitleDark : styles.subtitleLight,
          ]}
        >
          {streak.currentStreak}/{streak.nextMilestone}
        </ThemedText>
        <View
          style={[
            styles.progressTrack,
            isDark ? styles.progressTrackDark : styles.progressTrackLight,
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.round(
                  Math.min(streak.currentStreak / streak.nextMilestone, 1) *
                    100,
                )}%`,
              },
            ]}
          />
        </View>
        <Ionicons color="#7d4ef6" name="gift-outline" size={16} />
      </View>

      <Pressable
        accessibilityRole={canRestore ? 'button' : undefined}
        disabled={!isCtaInteractive}
        onPress={onPressCta}
        style={({ pressed }) => [
          styles.ctaRow,
          canRestore
            ? isDark
              ? styles.ctaRowRestoreDark
              : styles.ctaRowRestoreLight
            : isDark
              ? styles.ctaRowDark
              : styles.ctaRowLight,
          !isCtaInteractive && canRestore ? styles.ctaRowDisabled : null,
          pressed ? styles.ctaRowPressed : null,
        ]}
      >
        <Ionicons
          color={canRestore ? '#ffffff' : isDark ? '#cbc7df' : '#5b5f76'}
          name={canRestore ? 'refresh' : 'information-circle-outline'}
          size={18}
        />
        <ThemedText
          type="bodyStrong"
          style={[
            styles.ctaRowText,
            canRestore
              ? styles.ctaRowRestoreText
              : isDark
                ? styles.subtitleDark
                : styles.subtitleLight,
          ]}
        >
          {isCtaLoading
            ? t('streak.restore.restoring')
            : t(getCtaTextKey(streak))}
        </ThemedText>
      </Pressable>
    </View>
  );
}
