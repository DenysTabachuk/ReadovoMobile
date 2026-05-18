import type { StreakAchievementMilestone } from './types';

export const STREAK_RESTORE_PRICE = 100;
export const STREAK_FREEZE_TOKEN_PRICE = 100;
export const STREAK_MAX_FREEZE_TOKENS = 3;

export const streakMilestones: readonly {
  milestone: StreakAchievementMilestone;
  rewardCoins: number;
}[] = [
  { milestone: 3, rewardCoins: 30 },
  { milestone: 7, rewardCoins: 70 },
  { milestone: 14, rewardCoins: 150 },
  { milestone: 30, rewardCoins: 400 },
  { milestone: 100, rewardCoins: 1500 },
];

export const weekDayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'] as const;

