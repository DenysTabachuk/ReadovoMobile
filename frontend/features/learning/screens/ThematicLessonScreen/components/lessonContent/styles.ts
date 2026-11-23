import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    activity: { flex: 1 },
    content: { gap: Spacing.lg },
    secondary: { color: colors.textSecondary },
  });
