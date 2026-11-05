import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    progressFilterAllText: {
      flex: 1,
    },
    progressFilterButton: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: 'row',
      gap: Spacing.sm,
      justifyContent: 'space-between',
      minHeight: 48,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    progressFilterField: {
      gap: Spacing.xs,
    },
    progressFilterOptionSelected: {
      backgroundColor: colors.selection,
      borderColor: colors.selectionBorder,
    },
    progressFilterOption: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: 'row',
      gap: Spacing.sm,
      justifyContent: 'space-between',
      minHeight: 56,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    progressFilterOptions: {
      gap: Spacing.sm,
    },
  });
