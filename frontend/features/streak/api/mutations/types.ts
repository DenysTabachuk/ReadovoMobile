import type { StreakAchievement } from '../../types';

export type StreakUpdateMutationParams = {
  userId?: string;
  onAchievementsUnlocked?: (achievements: StreakAchievement[]) => void;
};
