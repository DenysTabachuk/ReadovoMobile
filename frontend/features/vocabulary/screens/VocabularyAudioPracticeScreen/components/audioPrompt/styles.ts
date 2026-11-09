import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    prompt: { gap: Spacing.md, paddingVertical: Spacing.sm },
    playButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      minHeight: 48,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    playLabel: { color: colors.onPrimary, flexShrink: 1 },
    pressed: { opacity: 0.8 },
    hint: { color: colors.textSecondary },
    error: { color: colors.danger },
  });
