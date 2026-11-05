import { palette } from '@/constants/palette';
import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
    progressMenu: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      gap: Spacing.sm,
      elevation: 6,
      minWidth: 190,
      padding: Spacing.sm,
      position: 'absolute',
      right: 0,
      shadowColor: palette.black,
      shadowOffset: {
        height: 4,
        width: 0,
      },
      shadowOpacity: 0.14,
      shadowRadius: 10,
      top: 36,
      zIndex: 5,
    },
    progressMenuHint: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    progressMenuBadge: {
      alignSelf: 'flex-start',
    },
  });
};
