import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themedText';
import {
  getStreakCalendarMonth,
  type CalendarDayStatus,
  type StreakCalendarDay,
  type StreakState,
} from '@/features/streak';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { styles } from './styles';

type ActivityCalendarProps = {
  isCtaLoading?: boolean;
  onPressCta?: () => void;
  onRequestFreezeDay?: (day: StreakCalendarDay) => void;
  serverNow: string;
  streak: StreakState;
  userId?: string;
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

const CALENDAR_GRID_CELL_COUNT = 42;

function getStatusStyle(status: CalendarDayStatus) {
  if (status === 'completed' || status === 'today_completed') {
    return styles.dayCompleted;
  }

  if (status === 'missed') {
    return styles.dayMissed;
  }

  if (status === 'frozen') {
    return styles.dayFrozen;
  }

  if (status === 'restored') {
    return styles.dayRestored;
  }

  if (status === 'today_pending') {
    return styles.dayTodayPending;
  }

  if (status === 'future') {
    return styles.dayFuture;
  }

  return styles.dayNeutral;
}

function getStatusIcon(status: CalendarDayStatus, isDark: boolean): ReactElement | null {
  if (status === 'completed' || status === 'today_completed') {
    return <Ionicons color="#ffffff" name="checkmark" size={12} style={styles.dayIcon} />;
  }

  if (status === 'missed') {
    return <Ionicons color="#ffffff" name="close" size={12} style={styles.dayIcon} />;
  }

  if (status === 'frozen') {
    return <Ionicons color="#ffffff" name="snow" size={11} style={styles.dayIcon} />;
  }

  if (status === 'restored') {
    return (
      <Ionicons
        color={isDark ? '#ffffff' : '#5c3410'}
        name="refresh"
        size={11}
        style={styles.dayIcon}
      />
    );
  }

  return null;
}

function getMonthStartOffset(dateKey: string): number {
  const day = new Date(`${dateKey}T00:00:00.000Z`).getUTCDay();
  return day === 0 ? 6 : day - 1;
}

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
  userId,
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
  const [visibleMonth, setVisibleMonth] = useState(initialDate.getUTCMonth() + 1);

  const calendarQuery = useQuery({
    enabled: Boolean(userId),
    queryFn: () => getStreakCalendarMonth(userId ?? '', visibleYear, visibleMonth),
    queryKey: ['streak-calendar-month', userId, visibleYear, visibleMonth],
  });

  const monthLabel = calendarQuery.data?.monthLabel ?? '';
  const serverDate = new Date(calendarQuery.data?.serverNow ?? serverNow);
  const canGoForward =
    visibleYear < serverDate.getUTCFullYear() ||
    (visibleYear === serverDate.getUTCFullYear() && visibleMonth < serverDate.getUTCMonth() + 1);

  const gridCells = useMemo(() => {
    const monthDays = calendarQuery.data?.days ?? [];

    if (monthDays.length === 0) {
      return Array.from(
        { length: CALENDAR_GRID_CELL_COUNT },
        () => null,
      ) as (StreakCalendarDay | null)[];
    }

    const offset = getMonthStartOffset(monthDays[0].date);
    const lead = Array.from({ length: offset }, () => null);
    const cells = [...lead, ...monthDays];
    const trailingCellCount = Math.max(
      CALENDAR_GRID_CELL_COUNT - cells.length,
      0,
    );

    return [
      ...cells,
      ...Array.from({ length: trailingCellCount }, () => null),
    ];
  }, [calendarQuery.data?.days]);

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
          <Ionicons color={isDark ? '#cbc7df' : '#5b5f76'} name="chevron-back" size={16} />
        </Pressable>
        <ThemedText
          type="bodyStrong"
          style={[styles.monthLabel, isDark ? styles.titleDark : styles.titleLight]}>
          {monthLabel}
        </ThemedText>
        <Pressable
          disabled={!canGoForward}
          onPress={goNextMonth}
          style={[styles.navButton, !canGoForward ? styles.navButtonDisabled : null]}>
          <Ionicons color={isDark ? '#cbc7df' : '#5b5f76'} name="chevron-forward" size={16} />
        </Pressable>
      </View>

      <View style={styles.weekHeaderRow}>
        {weekDayTranslationKeys.map((key) => (
          <ThemedText
            key={key}
            style={[styles.weekHeaderText, isDark ? styles.subtitleDark : styles.subtitleLight]}>
            {t(key)}
          </ThemedText>
        ))}
      </View>

      <View style={styles.grid}>
        {gridCells.map((cell, index) => {
          if (!cell) {
            return <View key={`empty-${index}`} style={styles.emptyDayCell} />;
          }

          const icon = getStatusIcon(cell.status, isDark);
          const canRequestFreeze =
            cell.status === 'missed' &&
            Boolean(onRequestFreezeDay);
          const dayContent = (
            <>
              <ThemedText
                style={[
                  styles.dayText,
                  cell.status === 'future'
                    ? (isDark ? styles.futureDayTextDark : styles.futureDayTextLight)
                    : (isDark ? styles.dayTextDark : styles.dayTextLight),
                ]}>
                {cell.dayOfMonth}
              </ThemedText>
              {icon}
            </>
          );

          if (canRequestFreeze) {
            return (
              <Pressable
                accessibilityRole="button"
                key={cell.date}
                onPress={() => onRequestFreezeDay?.(cell)}
                style={({ pressed }) => [
                  styles.dayCell,
                  getStatusStyle(cell.status),
                  isDark ? styles.dayCellDark : styles.dayCellLight,
                  styles.dayPressable,
                  pressed ? styles.dayPressed : null,
                ]}>
                {dayContent}
              </Pressable>
            );
          }

          return (
            <View
              key={cell.date}
              style={[
                styles.dayCell,
                getStatusStyle(cell.status),
                isDark ? styles.dayCellDark : styles.dayCellLight,
              ]}>
              {dayContent}
            </View>
          );
        })}
      </View>

      <View style={styles.summaryTopRow}>
        <View style={styles.summaryValueRow}>
          <Ionicons color={isDark ? '#f2994a' : '#d97706'} name="flame" size={18} />
          <ThemedText
            type="sectionTitle"
            style={[styles.summaryValue, isDark ? styles.titleDark : styles.titleLight]}>
            {streak.currentStreak}
          </ThemedText>
          <ThemedText style={[styles.summarySuffix, isDark ? styles.subtitleDark : styles.subtitleLight]}>
            {t('streak.summary.daysInRow')}
          </ThemedText>
        </View>
        <ThemedText style={[styles.summaryStatus, isDark ? styles.statusDark : styles.statusLight]}>
          {t(getStatusTextKey(streak.todayStatus))}
        </ThemedText>
      </View>

      <View style={styles.progressRow}>
        <ThemedText style={[styles.progressCounter, isDark ? styles.subtitleDark : styles.subtitleLight]}>
          {streak.currentStreak}/{streak.nextMilestone}
        </ThemedText>
        <View style={[styles.progressTrack, isDark ? styles.progressTrackDark : styles.progressTrackLight]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.round(
                  Math.min(streak.currentStreak / streak.nextMilestone, 1) * 100,
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
            ? (isDark ? styles.ctaRowRestoreDark : styles.ctaRowRestoreLight)
            : (isDark ? styles.ctaRowDark : styles.ctaRowLight),
          !isCtaInteractive && canRestore ? styles.ctaRowDisabled : null,
          pressed ? styles.ctaRowPressed : null,
        ]}>
        <Ionicons
          color={canRestore ? '#ffffff' : (isDark ? '#cbc7df' : '#5b5f76')}
          name={canRestore ? 'refresh' : 'information-circle-outline'}
          size={18}
        />
        <ThemedText
          type="bodyStrong"
          style={[
            styles.ctaRowText,
            canRestore ? styles.ctaRowRestoreText : (isDark ? styles.subtitleDark : styles.subtitleLight),
          ]}>
          {isCtaLoading ? t('streak.restore.restoring') : t(getCtaTextKey(streak))}
        </ThemedText>
      </Pressable>
    </View>
  );
}
