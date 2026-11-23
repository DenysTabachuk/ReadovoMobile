import { StyleSheet } from 'react-native';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    selected: {
      borderColor: colors.selectionBorder,
      backgroundColor: colors.selection,
    },
    correct: {
      borderColor: colors.successBorder,
      backgroundColor: colors.successSurface,
    },
    incorrect: {
      borderColor: colors.dangerBorder,
      backgroundColor: colors.dangerSurface,
    },
    pressed: { opacity: 0.8 },
  });
