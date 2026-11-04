import { StyleSheet } from 'react-native';
import type { ThemeColors } from '@/constants/theme';

import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    field: {
      gap: Spacing.xs,
      minWidth: 140,
    },
    pickerButton: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 48,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    pickerButtonContent: {
      alignItems: 'center',
      flexDirection: 'row',
      flex: 1,
      gap: Spacing.sm,
      minWidth: 0,
    },
    pickerLabel: {
      flex: 1,
    },
  });
