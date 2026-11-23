import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

const PLAY_ICON_DIAMETER = 72;

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    prompt: { gap: Spacing.md },
    playButton: {
      backgroundColor: colors.surface,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
      gap: Spacing.sm,
    },
    playIcon: {
      width: PLAY_ICON_DIAMETER,
      height: PLAY_ICON_DIAMETER,
      borderRadius: PLAY_ICON_DIAMETER / 2,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playLabel: { textAlign: 'center' },
    pressed: { opacity: 0.8 },
    error: { color: colors.danger },
  });
