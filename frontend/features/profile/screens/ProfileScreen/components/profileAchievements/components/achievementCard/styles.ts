import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
    achievementCard: {
      alignItems: 'center',
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      gap: Spacing.md,
      overflow: 'hidden',
      padding: Spacing.md,
      position: 'relative',
    },
    lockedAchievementCard: {
      backgroundColor: 'transparent',
      borderColor: colors.borderSubtle,
    },
    unlockedAchievementCard: {
      borderColor: colors.borderSubtle,
    },
    unlockedAchievementGradient: {
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    achievementBadge: {
      height: 56,
      width: 56,
    },
    lockedAchievementBadge: {
      opacity: 0.4,
    },
    achievementMeta: {
      flex: 1,
      gap: Spacing.xs,
    },
    achievementDescription: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    achievementProgressBlock: {
      gap: Spacing.xs,
    },
    achievementProgressFill: {
      borderRadius: 999,
      height: '100%',
    },
    lockedAchievementProgressFill: {
      backgroundColor: colors.primary,
    },
    unlockedAchievementProgressFill: {
      backgroundColor: colors.primary,
    },
    achievementProgressText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 18,
    },
    achievementProgressTrack: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 999,
      height: 8,
      overflow: 'hidden',
      width: '100%',
    },
    rewardRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    moneyIcon: {
      height: 18,
      width: 18,
    },
    rewardText: {
      color: colors.success,
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 20,
    },
    unlockedText: {
      color: colors.success,
      fontSize: 13,
      fontWeight: '600',
    },
    lockedText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
    },
  });
};
