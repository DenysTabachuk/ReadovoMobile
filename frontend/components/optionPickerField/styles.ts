import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    field: {
      gap: Spacing.xs,
      minWidth: 140,
    },
    optionsList: {
      gap: Spacing.sm,
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
    pickerLabel: {
      flex: 1,
      paddingRight: Spacing.sm,
    },
  });
