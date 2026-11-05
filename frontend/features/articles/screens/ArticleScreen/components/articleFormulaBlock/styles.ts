import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderColor: colors.borderSubtle,
      borderRadius: 12,
      borderWidth: 1,
      minHeight: 56,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    fallbackText: {
      textAlign: 'center',
    },
    scrollContent: {
      alignItems: 'center',
      minWidth: '100%',
    },
  });
