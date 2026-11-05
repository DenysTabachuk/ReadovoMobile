import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

import { CALENDAR_GRID_ROWS, DAY_CELL_SIZE } from './constants';

const CALENDAR_GRID_GAP = 8;

export const createStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
    card: {
      borderRadius: 18,
      borderWidth: 1,
      gap: Spacing.sm,
      padding: Spacing.lg,
      backgroundColor: colors.surface,
      borderColor: colors.borderSubtle,
    },
    ctaRow: {
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: 'row',
      gap: Spacing.xs,
      justifyContent: 'center',
      paddingVertical: Spacing.sm,
      backgroundColor: colors.surface,
      borderColor: colors.accentBorder,
    },
    ctaRowDisabled: {
      opacity: 0.55,
    },
    ctaRowPressed: {
      opacity: 0.78,
    },
    ctaRowRestoreText: {
      color: colors.onWarningSolid,
    },
    ctaRowText: {
      fontSize: 14,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: CALENDAR_GRID_GAP,
      minHeight:
        DAY_CELL_SIZE * CALENDAR_GRID_ROWS +
        CALENDAR_GRID_GAP * (CALENDAR_GRID_ROWS - 1),
    },
    headerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    monthLabel: {
      fontSize: 16,
    },
    navButton: {
      alignItems: 'center',
      borderRadius: 12,
      height: 24,
      justifyContent: 'center',
      width: 24,
    },
    navButtonDisabled: {
      opacity: 0.35,
    },
    progressCounter: {
      fontSize: 12,
      minWidth: 36,
    },
    progressFill: {
      backgroundColor: colors.primary,
      borderRadius: 999,
      height: '100%',
    },
    progressRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    progressTrack: {
      borderRadius: 999,
      flex: 1,
      height: 8,
      overflow: 'hidden',
      backgroundColor: colors.surfaceMuted,
    },
    summaryStatus: {
      flex: 1,
      fontSize: 12,
      lineHeight: 16,
      textAlign: 'right',
    },
    summarySuffix: {
      fontSize: 13,
    },
    summaryTopRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    summaryValue: {
      fontSize: 24,
      lineHeight: 28,
    },
    summaryValueRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    weekHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    weekHeaderText: {
      fontSize: 12,
      textAlign: 'center',
      width: DAY_CELL_SIZE,
    },
    ctaRowRestore: {
      backgroundColor: colors.warningSolid,
      borderColor: colors.warningBorder,
    },
    status: {
      color: colors.textSecondary,
    },
    subtitle: {
      color: colors.textSecondary,
    },
    title: {
      color: colors.text,
    },
  });
};
