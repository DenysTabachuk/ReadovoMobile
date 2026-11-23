import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { gap: Spacing.lg },
    secondary: { color: colors.textSecondary },
    prompt: { fontSize: 24, lineHeight: 32, marginVertical: Spacing.sm },
    action: { marginTop: 'auto', paddingTop: Spacing.xLg, gap: Spacing.md },
    hint: { color: colors.textSecondary, textAlign: 'center', fontSize: 14 },
    feedback: {
      gap: Spacing.sm,
      padding: Spacing.lg,
      borderRadius: 16,
      backgroundColor: colors.surface,
    },
  });
