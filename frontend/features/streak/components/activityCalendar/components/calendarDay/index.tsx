import { useMemo, type ComponentProps, type ReactElement } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themedText';
import type { CalendarDayStatus, StreakCalendarDay } from '../../../../types';

import { createStyles } from './styles';

type CalendarDayProps = {
  day: StreakCalendarDay | null;
  onRequestFreezeDay: (day: StreakCalendarDay) => void;
};

type StatusIconConfig = Pick<ComponentProps<typeof Ionicons>, 'name' | 'size'>;
type StatusStyleKeys = {
  cell: keyof ReturnType<typeof createStyles>;
  text: keyof ReturnType<typeof createStyles>;
};

const STATUS_ICONS: Partial<Record<CalendarDayStatus, StatusIconConfig>> = {
  completed: { name: 'checkmark', size: 12 },
  today_completed: { name: 'checkmark', size: 12 },
  missed: { name: 'close', size: 12 },
  frozen: { name: 'snow', size: 11 },
  restored: { name: 'refresh', size: 11 },
};

const STATUS_STYLE_KEYS = {
  completed: { cell: 'dayCompleted', text: 'completedDayText' },
  today_completed: { cell: 'dayCompleted', text: 'completedDayText' },
  missed: { cell: 'dayMissed', text: 'missedDayText' },
  frozen: { cell: 'dayFrozen', text: 'frozenDayText' },
  restored: { cell: 'dayRestored', text: 'restoredDayText' },
  today_pending: { cell: 'dayTodayPending', text: 'dayText' },
  future: { cell: 'dayFuture', text: 'futureDayText' },
  neutral: { cell: 'dayNeutral', text: 'dayText' },
} as const satisfies Record<CalendarDayStatus, StatusStyleKeys>;

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

  if (!day) {
    return <View style={styles.emptyDayCell} />;
  }
  const statusStyleKeys = STATUS_STYLE_KEYS[day.status];
  const textStyle = styles[statusStyleKeys.text];
  const icon = getStatusIcon(day.status, textStyle.color, styles);
  const canRequestFreeze = day.status === 'missed';
  const dayContent = (
    <>
      <ThemedText style={[styles.dayText, textStyle]}>
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
          styles[statusStyleKeys.cell],
          styles.dayPressable,
          pressed ? styles.dayPressed : null,
        ]}
      >
        {dayContent}
      </Pressable>
    );
  }

  return (
    <View style={[styles.dayCell, styles[statusStyleKeys.cell]]}>
      {dayContent}
    </View>
  );
}
