import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
    correctFeedbackText: {
      color: colors.success,
    },
    feedbackBlock: {
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: 'row',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    feedbackText: {
      flex: 1,
      minWidth: 0,
    },
    wrongFeedbackText: {
      color: colors.danger,
    },
    correctFeedbackBlock: {
      backgroundColor: colors.successSurface,
      borderColor: colors.successBorder,
    },
    wrongFeedbackBlock: {
      backgroundColor: colors.dangerSurface,
      borderColor: colors.dangerBorder,
    },
  });
};
