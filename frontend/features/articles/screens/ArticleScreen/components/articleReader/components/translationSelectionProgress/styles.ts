import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';
export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    translationProgressTrack: {
      backgroundColor: colors.surfaceMuted,
      height: 2,
      overflow: 'hidden',
      width: '100%',
    },
    translationProgressFill: {
      backgroundColor: colors.interactive,
      borderRadius: 999,
      height: '100%',
    },
  });
