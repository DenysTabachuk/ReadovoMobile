import type { ThemeColors } from '@/constants/theme';
import type { DictionaryWordProgress } from '../../../../../../api/types';
import { getProgressBadgeColors } from '../../../../utils/getProgressBadgeColors';
import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';

export const createStyles = (
  colors: ThemeColors,
  progress: DictionaryWordProgress,
) => {
  const badgeColors = getProgressBadgeColors(progress, colors);
  return StyleSheet.create({
    progressBadge: {
      backgroundColor: badgeColors.backgroundColor,
      borderRadius: 8,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    progressFilterBadge: {
      alignSelf: 'flex-start',
    },
    progressText: {
      color: badgeColors.textColor,
      textAlign: 'center',
    },
  });
};
