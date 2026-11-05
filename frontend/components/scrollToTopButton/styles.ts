import { palette } from '@/constants/palette';
import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      backgroundColor: colors.accentSolid,
      alignItems: 'center',
      borderRadius: 999,
      justifyContent: 'center',
      shadowColor: palette.black,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.25,
      shadowRadius: 10,
    },
    wrapper: {
      position: 'absolute',
      zIndex: 30,
    },
    wrapperDefault: {
      bottom: Spacing.xLg,
      right: Spacing.xLg,
    },
  });
