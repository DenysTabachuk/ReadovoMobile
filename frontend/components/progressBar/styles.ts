import { StyleSheet } from 'react-native';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors, height: number) =>
  StyleSheet.create({
    track: {
      height,
      borderRadius: height / 2,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: height / 2,
      backgroundColor: colors.interactive,
    },
  });
