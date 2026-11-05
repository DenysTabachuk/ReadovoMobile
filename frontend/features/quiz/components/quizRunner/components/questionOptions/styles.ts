import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
    checkboxIndicator: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    correctOption: {
      backgroundColor: colors.successSurface,
      borderColor: colors.success,
    },
    correctOptionText: {
      color: colors.success,
    },
    disabledOption: {
      opacity: 0.6,
    },
    optionButton: {
      alignItems: 'center',
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: 'row',
      gap: Spacing.md,
      maxWidth: 420,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
    },
    options: {
      gap: Spacing.sm,
    },
    optionText: {
      flex: 1,
      minWidth: 0,
      textAlign: 'left',
    },
    pressedOption: {
      opacity: 0.82,
    },
    selectedOption: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    selectedOptionText: {
      color: colors.onPrimary,
    },
    unselectedOption: {
      backgroundColor: 'transparent',
      borderColor: colors.primary,
    },
    unselectedOptionText: {
      color: colors.link,
    },
    wrongOption: {
      backgroundColor: colors.dangerSurface,
      borderColor: colors.danger,
    },
    wrongOptionText: {
      color: colors.danger,
    },
  });
};
