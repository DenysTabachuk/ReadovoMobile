import type { DictionaryWordProgress } from '../../../../api/types';
import type { ThemeColors } from '@/constants/theme';

/**
 * Choose badge colors from the caller's resolved semantic palette.
 * @param progress - Dictionary learning state; new words use the default branch.
 * @param colors - Resolved application colors, without hooks or system appearance reads.
 * @returns Background and text colors for the badge; does not mutate inputs.
 * @example
 * // getProgressBadgeColors('learned', themeColors.light)
 * // => { backgroundColor: '#dff7e8', textColor: '#217a3b' }
 */
export function getProgressBadgeColors(
  progress: DictionaryWordProgress,
  colors: ThemeColors,
) {
  if (progress === 'learned')
    return {
      backgroundColor: colors.successSurface,
      textColor: colors.success,
    };
  if (progress === 'in_progress')
    return {
      backgroundColor: colors.warningSurface,
      textColor: colors.warning,
    };
  return {
    backgroundColor: colors.infoSurface,
    textColor: colors.info,
  };
}
