import { type StreakAchievement } from './types';

export function getNewlyUnlockedStreakAchievements(
  previousAchievements: StreakAchievement[],
  nextAchievements: StreakAchievement[],
): StreakAchievement[] {
  const previouslyUnlockedMilestones = new Set(
    previousAchievements
      .filter((achievement) => achievement.isUnlocked)
      .map((achievement) => achievement.milestone),
  );

  return nextAchievements.filter(
    (achievement) =>
      achievement.isUnlocked &&
      !previouslyUnlockedMilestones.has(achievement.milestone),
  );
}

export function getStreakAchievementTitleKey(
  achievement: StreakAchievement,
): string {
  return `streak.achievements.${achievement.milestone}.title`;
}

export function getStreakAchievementDescriptionKey(
  achievement: StreakAchievement,
): string {
  return `streak.achievements.${achievement.milestone}.description`;
}
