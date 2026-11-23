import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
  });
