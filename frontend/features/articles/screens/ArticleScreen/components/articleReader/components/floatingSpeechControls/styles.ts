import type { ThemeColors } from '@/constants/theme';
import { Spacing } from '@/constants/spacing';
import { StyleSheet } from 'react-native';
export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    floatingSpeechControls: {
      backgroundColor: colors.background,
      left: 0,
      paddingHorizontal: Spacing.xLg,
      paddingVertical: Spacing.sm,
      position: 'absolute',
      right: 0,
      top: 0,
      zIndex: 20,
    },
  });
