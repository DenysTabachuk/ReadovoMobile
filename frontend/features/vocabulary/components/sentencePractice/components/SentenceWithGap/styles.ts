import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    panel: {
      backgroundColor: colors.surfaceMuted,
      padding: Spacing.lg,
      borderRadius: 20,
    },
    gap: { color: colors.interactive },
  });
