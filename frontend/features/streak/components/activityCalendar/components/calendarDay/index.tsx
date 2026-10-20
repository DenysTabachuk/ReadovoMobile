import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import type { ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themedText';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { CalendarDayStatus, StreakCalendarDay } from '../../../../types';

import { styles } from './styles';

type CalendarDayProps = {
  day: StreakCalendarDay | null;
  onRequestFreezeDay: (day: StreakCalendarDay) => void;
};

type StatusIconConfig = Pick<ComponentProps<typeof Ionicons>, 'name' | 'size'>;

const STATUS_ICONS: Partial<Record<CalendarDayStatus, StatusIconConfig>> = {
  completed: { name: 'checkmark', size: 12 },
  today_completed: { name: 'checkmark', size: 12 },
  missed: { name: 'close', size: 12 },
  frozen: { name: 'snow', size: 11 },
  restored: { name: 'refresh', size: 11 },
};

const STATUS_STYLES = {
  completed: styles.dayCompleted,
  today_completed: styles.dayCompleted,
  missed: styles.dayMissed,
  frozen: styles.dayFrozen,
  restored: styles.dayRestored,
  today_pending: styles.dayTodayPending,
  future: styles.dayFuture,
  neutral: styles.dayNeutral,
} satisfies Record<CalendarDayStatus, ViewStyle>;

function getStatusIcon(
  status: CalendarDayStatus,
  isDark: boolean,
): ReactElement | null {
  const icon = STATUS_ICONS[status];
  if (!icon) {
    return null;
  }

  return (
    <Ionicons
      color={status === 'restored' && !isDark ? '#5c3410' : '#ffffff'}
      name={icon.name}
      size={icon.size}
      style={styles.dayIcon}
    />
  );
}

export function CalendarDay({ day, onRequestFreezeDay }: CalendarDayProps) {
  const isDark = useColorScheme() === 'dark';
  if (!day) {
    return <View style={styles.emptyDayCell} />;
  }
  const icon = getStatusIcon(day.status, isDark);
  const canRequestFreeze = day.status === 'missed';
  const dayContent = (
    <>
      <ThemedText
        style={[
          styles.dayText,
          day.status === 'future'
            ? isDark
              ? styles.futureDayTextDark
              : styles.futureDayTextLight
            : isDark
              ? styles.dayTextDark
              : styles.dayTextLight,
        ]}
      >
        {day.dayOfMonth}
      </ThemedText>
      {icon}
    </>
  );

  if (canRequestFreeze) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => onRequestFreezeDay(day)}
        style={({ pressed }) => [
          styles.dayCell,
          STATUS_STYLES[day.status],
          isDark ? styles.dayCellDark : styles.dayCellLight,
          styles.dayPressable,
          pressed ? styles.dayPressed : null,
        ]}
      >
        {dayContent}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.dayCell,
        STATUS_STYLES[day.status],
        isDark ? styles.dayCellDark : styles.dayCellLight,
      ]}
    >
      {dayContent}
    </View>
  );
}
