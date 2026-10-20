import type { AchievementStatus } from '@/features/achievements';

type AchievementProgressInput = Pick<
  AchievementStatus,
  'progressValue' | 'targetValue'
>;

type AchievementProgressDisplay = {
  percentage: `${number}%`;
  text: string;
};

/**
 * Formats achievement progress for the card's fill width and counter.
 * Caps progress at the target and rounds the fill percentage to the nearest integer.
 *
 * @param achievement - Non-negative progress and a positive target from the achievement definition.
 * @returns Percentage width and capped counter text, without modifying the input.
 * @example
 * resolveAchievementProgress({ progressValue: 2, targetValue: 3 });
 * // => { percentage: '67%', text: '2/3' }
 */
export function resolveAchievementProgress({
  progressValue,
  targetValue,
}: AchievementProgressInput): AchievementProgressDisplay {
  const ratio = Math.min(progressValue / targetValue, 1);

  return {
    percentage: `${Math.round(ratio * 100)}%`,
    text: `${Math.min(progressValue, targetValue)}/${targetValue}`,
  };
}
