import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

import { DAY_CELL_SIZE } from '../../constants';

export const createStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
    dayCell: {
      alignItems: 'center',
      borderRadius: 14,
      height: DAY_CELL_SIZE,
      justifyContent: 'center',
      position: 'relative',
      width: DAY_CELL_SIZE,
      borderColor: colors.border,
    },
    dayCompleted: {
      backgroundColor: colors.accentSolid,
    },
    dayFrozen: {
      backgroundColor: colors.infoSolid,
    },
    dayFuture: {
      backgroundColor: 'transparent',
    },
    dayIcon: {
      position: 'absolute',
      right: 3,
      top: 3,
    },
    dayMissed: {
      backgroundColor: colors.dangerSolid,
    },
    dayNeutral: {
      backgroundColor: 'transparent',
    },
    dayPressable: {
      borderColor: colors.borderStrong,
      borderWidth: 1,
    },
    dayPressed: {
      opacity: 0.7,
    },
    dayRestored: {
      backgroundColor: colors.highlight,
    },
    completedDayText: { color: colors.onAccentSolid },
    missedDayText: { color: colors.onDangerSolid },
    frozenDayText: { color: colors.onInfoSolid },
    restoredDayText: { color: colors.onHighlight },
    dayText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    dayTodayPending: {
      backgroundColor: 'transparent',
      borderColor: colors.interactive,
      borderWidth: 2,
    },
    emptyDayCell: {
      height: DAY_CELL_SIZE,
      width: DAY_CELL_SIZE,
    },
    futureDayText: {
      color: colors.textMuted,
    },
  });
};
