import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    session: { flex: 1, backgroundColor: colors.background },
    content: { gap: Spacing.lg },
    footer: {
      paddingHorizontal: Spacing.xLg,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.lg,
    },
  });
