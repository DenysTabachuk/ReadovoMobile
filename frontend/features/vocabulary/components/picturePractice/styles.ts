import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { gap: Spacing.lg },
    secondary: { color: colors.textSecondary },
    options: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      columnGap: '3%',
      rowGap: Spacing.md,
    },
    credit: {
      color: colors.textSecondary,
      textAlign: 'center',
      fontSize: 12,
      lineHeight: 18,
    },
  });
