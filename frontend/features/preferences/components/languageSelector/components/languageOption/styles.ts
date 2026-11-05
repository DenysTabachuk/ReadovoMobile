import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
    languageButton: {
      alignItems: 'center',
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: 'row',
      gap: Spacing.md,
      maxWidth: 420,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    languageButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    languageLabel: {
      flexShrink: 1,
    },
    selectedLanguageText: {
      color: colors.onPrimary,
    },
  });
};
