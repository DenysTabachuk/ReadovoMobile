import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { gap: Spacing.lg },
    secondary: { color: colors.textSecondary },
    options: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    feedback: {
      padding: Spacing.lg,
      borderRadius: 20,
      gap: Spacing.sm,
      borderWidth: 1,
    },
    correctFeedback: {
      backgroundColor: colors.successSurface,
      borderColor: colors.successBorder,
    },
    incorrectFeedback: {
      backgroundColor: colors.dangerSurface,
      borderColor: colors.dangerBorder,
    },
    credit: {
      color: colors.textSecondary,
      textAlign: 'center',
      fontSize: 12,
      lineHeight: 18,
    },
  });
