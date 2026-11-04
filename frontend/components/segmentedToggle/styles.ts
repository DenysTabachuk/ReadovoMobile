import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 12,
      flexDirection: 'row',
      padding: Spacing.xs,
      width: '100%',
    },
    activeOption: {
      backgroundColor: colors.primary,
    },
    activeText: {
      color: colors.onPrimary,
    },
    inactiveText: {
      color: colors.text,
    },
    option: {
      borderRadius: 10,
      flex: 1,
      minWidth: 0,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    text: {
      textAlign: 'center',
    },
  });
