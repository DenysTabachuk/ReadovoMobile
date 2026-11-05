import { useMemo, type ComponentProps, type ReactElement } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import type { ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themedText';
import type { CalendarDayStatus, StreakCalendarDay } from '../../../../types';

import { createStyles } from './styles';

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

function getStatusIcon(
  status: CalendarDayStatus,
  iconColor: string,
  styles: ReturnType<typeof createStyles>,
): ReactElement | null {
  const icon = STATUS_ICONS[status];
  if (!icon) {
    return null;
  }

  return (
    <Ionicons
      color={iconColor}
      name={icon.name}
      size={icon.size}
      style={styles.dayIcon}
    />
  );
}

export function CalendarDay({ day, onRequestFreezeDay }: CalendarDayProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const statusStyles = {
    completed: styles.dayCompleted,
    today_completed: styles.dayCompleted,
    missed: styles.dayMissed,
    frozen: styles.dayFrozen,
    restored: styles.dayRestored,
    today_pending: styles.dayTodayPending,
    future: styles.dayFuture,
    neutral: styles.dayNeutral,
  } satisfies Record<CalendarDayStatus, ViewStyle>;

  if (!day) {
    return <View style={styles.emptyDayCell} />;
  }
  const iconColor =
    day.status === 'restored' ? colors.onHighlight : colors.onPrimary;
  const icon = getStatusIcon(day.status, iconColor, styles);
  const canRequestFreeze = day.status === 'missed';
  const isFilledDay = [
    'completed',
    'today_completed',
    'missed',
    'frozen',
  ].includes(day.status);
  const dayContent = (
    <>
      <ThemedText
        style={[
          styles.dayText,
          day.status === 'future' ? styles.futureDayText : styles.dayText,
          isFilledDay ? styles.filledDayText : null,
          day.status === 'restored' ? styles.restoredDayText : null,
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
          statusStyles[day.status],
          styles.dayCell,
          styles.dayPressable,
          pressed ? styles.dayPressed : null,
        ]}
      >
        {dayContent}
      </Pressable>
    );
  }

  return (
    <View style={[styles.dayCell, statusStyles[day.status], styles.dayCell]}>
      {dayContent}
    </View>
  );
}
