import { StyleSheet } from 'react-native';
import { palette } from '@/constants/palette';
import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    imagePanel: {
      backgroundColor: palette.cream100,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.sm,
    },
    image: { width: '80%', maxWidth: 264, aspectRatio: 1, borderRadius: 12 },
    imageFallback: { backgroundColor: colors.surface },
    details: { padding: Spacing.lg, gap: Spacing.md },
    wordRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    wordText: { flex: 1, gap: Spacing.xs },
    secondary: { color: colors.textSecondary },
    audioButton: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pressed: { opacity: 0.75 },
    translation: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: Spacing.md,
    },
    languageBadge: {
      color: colors.onAccentSurface,
      backgroundColor: colors.accentSurface,
      borderRadius: 6,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    example: {
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
      paddingTop: Spacing.sm,
      gap: Spacing.sm,
    },
    exampleText: { flex: 1 },
    exampleAudio: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    error: { color: colors.danger },
  });
