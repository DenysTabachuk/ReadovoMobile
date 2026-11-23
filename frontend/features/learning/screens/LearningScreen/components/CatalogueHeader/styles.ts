import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: { gap: Spacing.lg },
    intro: { gap: Spacing.sm },
    description: { color: colors.textSecondary },
  });
