import type { ThemeColors } from '@/constants/theme';
import { Spacing } from '@/constants/spacing';
import { StyleSheet } from 'react-native';
export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    simplificationMetricsCard: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      gap: Spacing.sm,
      padding: Spacing.md,
    },
    simplificationMetricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    simplificationMetricsHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.xs,
    },
  });
