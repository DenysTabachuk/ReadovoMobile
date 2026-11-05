import type { ThemeColors } from '@/constants/theme';
import type { DictionaryWordProgress } from '../../../../api/types';
import { getProgressBadgeColors } from '../../utils/getProgressBadgeColors';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const createStyles = (
  colors: ThemeColors,
  progress: DictionaryWordProgress,
) => {
  const badgeColors = getProgressBadgeColors(progress, colors);
  return StyleSheet.create({
    cardTapHint: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.xs,
      justifyContent: 'center',
      marginTop: Spacing.xs,
    },
    cardTapHintText: {
      fontSize: 12,
      lineHeight: 16,
      opacity: 0.68,
      textAlign: 'center',
    },
    wordCard: {
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      gap: Spacing.md,
      padding: Spacing.md,
    },
    cardHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.md,
      justifyContent: 'space-between',
    },
    wordTitleGroup: {
      flex: 1,
      gap: Spacing.xs,
    },
    wordText: {
      flexShrink: 1,
    },
    wordPreviewText: {
      opacity: 0.78,
    },
    progressBadge: {
      backgroundColor: badgeColors.backgroundColor,
      borderRadius: 8,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    progressControl: {
      alignItems: 'flex-end',
      gap: Spacing.xs,
      position: 'relative',
    },
    progressText: {
      color: badgeColors.textColor,
      textAlign: 'center',
    },
    learningProgressBlock: {
      gap: Spacing.xs,
    },
    learningProgressTrack: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 999,
      height: 8,
      overflow: 'hidden',
      width: '100%',
    },
    learningProgressFill: {
      backgroundColor: colors.primary,
      borderRadius: 999,
      height: '100%',
    },
    learningProgressText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 18,
    },
  });
};
