import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
    card: {
      borderRadius: 14,
      borderWidth: 1,
      gap: Spacing.xs,
      padding: Spacing.md,
      width: 150,
    },
    progressFill: {
      backgroundColor: colors.primary,
      borderRadius: 999,
      height: '100%',
    },
    progressText: {
      fontSize: 12,
      color: colors.text,
    },
    progressTrack: {
      borderRadius: 999,
      height: 7,
      overflow: 'hidden',
      width: '100%',
      backgroundColor: colors.surfaceMuted,
    },
    reward: {
      color: colors.warning,
      fontSize: 13,
      fontWeight: '600',
    },
    status: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    title: {
      fontSize: 15,
      color: colors.text,
    },
    titleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    lockedCard: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.borderSubtle,
    },
    unlockedCard: {
      backgroundColor: colors.accentSurface,
      borderColor: colors.accentBorder,
    },
  });
};
