import { palette } from '@/constants/palette';
import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    actions: {
      gap: Spacing.md,
    },
    actionsWithBackground: {
      backgroundColor: colors.background,
      borderTopColor: colors.borderSubtle,
      borderTopWidth: 1,
      paddingHorizontal: Spacing.xLg,
      paddingVertical: Spacing.sm,
    },
    button: {
      borderRadius: 8,
      shadowColor: palette.black,
      shadowOffset: {
        height: 4,
        width: 0,
      },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    buttonFullWidth: {
      flex: 1,
    },
    label: {
      textAlign: 'center',
    },
    horizontal: {
      flexDirection: 'row',
    },
    vertical: {
      flexDirection: 'column',
    },
    wrapper: {
      left: Spacing.xLg,
      position: 'absolute',
      right: Spacing.xLg,
      zIndex: 20,
    },
    wrapperFullWidth: {
      left: 0,
      right: 0,
    },
  });
