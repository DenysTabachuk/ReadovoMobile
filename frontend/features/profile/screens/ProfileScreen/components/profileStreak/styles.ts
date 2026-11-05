import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
    streakBlock: {
      gap: Spacing.md,
    },
    streakAchievementsRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      paddingRight: Spacing.sm,
    },
    streakRetryButton: {
      backgroundColor: colors.accentSurface,
      borderRadius: 999,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
    },
    avatarButtonPressed: {
      opacity: 0.72,
    },
    streakRetryButtonText: {
      color: colors.onAccentSurface,
    },
  });
};
