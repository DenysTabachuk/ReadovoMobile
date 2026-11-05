import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      flex: 1,
      paddingBottom: Spacing.xxLg,
      paddingHorizontal: Spacing.xLg,
    },
  });
