import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
    card: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.borderSubtle,
      borderRadius: 20,
      borderWidth: 1,
      gap: Spacing.sm,
      padding: Spacing.lg,
    },
    text: {
      color: colors.text,
      textAlign: 'center',
    },
    retryButton: {
      backgroundColor: colors.accentSurface,
      borderRadius: 999,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
    },
    buttonPressed: {
      opacity: 0.72,
    },
    retryButtonText: {
      color: colors.onAccentSurface,
    },
  });
};
