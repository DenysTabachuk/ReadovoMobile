import { StyleSheet } from 'react-native';
import type { ThemeColors } from '@/constants/theme';
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
