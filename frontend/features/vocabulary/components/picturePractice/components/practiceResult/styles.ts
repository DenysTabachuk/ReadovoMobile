import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { gap: Spacing.lg },
    summary: {
      alignItems: 'center',
      gap: Spacing.md,
      paddingVertical: Spacing.xLg,
    },
    secondary: { color: colors.textSecondary, textAlign: 'center' },
    review: {
      padding: Spacing.lg,
      gap: Spacing.md,
      borderRadius: 20,
      backgroundColor: colors.surfaceMuted,
    },
    word: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
  });
