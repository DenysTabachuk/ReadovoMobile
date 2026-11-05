import { palette } from '@/constants/palette';
import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

export const createStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
    overlay: {
      left: 0,
      paddingHorizontal: Spacing.lg,
      position: 'absolute',
      right: 0,
      zIndex: 1000,
    },
    banner: {
      borderLeftWidth: 4,
      borderRadius: 8,
      borderWidth: 1,
      elevation: 6,
      gap: Spacing.xs,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      position: 'relative',
      shadowColor: palette.black,
      shadowOffset: {
        height: 4,
        width: 0,
      },
      shadowOpacity: 0.18,
      shadowRadius: 12,
    },
    success: {
      backgroundColor: colors.successSolid,
    },
    error: {
      backgroundColor: colors.dangerSolid,
    },
    info: {
      backgroundColor: colors.infoSolid,
      borderColor: colors.infoBorder,
      borderLeftColor: colors.infoBorder,
    },
    reward: {
      backgroundColor: colors.warningSolid,
      borderColor: colors.warningBorder,
    },
    achievement: {
      backgroundColor: colors.surface,
      borderColor: colors.accentBorder,
      borderLeftColor: colors.accentBorder,
      overflow: 'hidden',
    },
    achievementGradient: {
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    content: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.md,
      position: 'relative',
    },
    rewardIcon: {
      height: 40,
      width: 40,
    },
    streakIcon: {
      marginHorizontal: Spacing.sm,
    },
    achievementBadge: {
      height: 56,
      width: 56,
    },
    achievementIconCircle: {
      alignItems: 'center',
      borderRadius: 28,
      borderWidth: 1,
      height: 56,
      justifyContent: 'center',
      width: 56,
      backgroundColor: colors.infoSurface,
      borderColor: colors.infoSurface,
    },
    textContent: {
      flex: 1,
      minWidth: 0,
    },
    warningText: { color: colors.onWarningSolid },
    title: {
      ...Typography.bodyStrong,
      color: colors.onPrimary,
    },
    description: {
      ...Typography.body,
      color: colors.onPrimary,
    },
    achievementTitle: {
      ...Typography.bodyStrong,
      color: colors.text,
    },
    achievementDescription: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    achievementStatus: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    achievementRewardRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    achievementMoneyIcon: {
      height: 18,
      width: 18,
    },
    achievementRewardText: {
      color: colors.warning,
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 20,
    },
    streak: {
      backgroundColor: colors.surface,
      borderColor: colors.successBorder,
      borderLeftColor: colors.successBorder,
    },
    streakText: {
      color: colors.text,
    },
  });
};
