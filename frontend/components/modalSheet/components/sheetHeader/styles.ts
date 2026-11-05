import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.md,
      minHeight: 36,
    },
    title: {
      flex: 1,
      minWidth: 0,
    },
    closeButton: {
      borderColor: colors.borderStrong,
      alignItems: 'center',
      borderRadius: 999,
      borderWidth: 1,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
  });
