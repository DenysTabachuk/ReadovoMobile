import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { gap: Spacing.lg },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    secondary: { color: colors.textSecondary },
    controls: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    previous: { flexGrow: 1, flexBasis: 96 },
    next: { flexGrow: 2, flexBasis: 144 },
    attribution: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
    },
  });
