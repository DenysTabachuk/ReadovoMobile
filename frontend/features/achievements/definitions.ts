import { type ImageSourcePropType } from 'react-native';

import { type AchievementStatus } from './types';

const achievementBadges: Record<string, ImageSourcePropType> = {
  'first-test-completed': require('../../assets/images/first-test-completed-badge.png'),
};

export function getAchievementBadge(badgeKey: string): ImageSourcePropType {
  return achievementBadges[badgeKey] ?? achievementBadges['first-test-completed'];
}

export function getNewlyUnlockedAchievements(
  previousAchievements: AchievementStatus[],
  nextAchievements: AchievementStatus[],
): AchievementStatus[] {
  const previouslyUnlockedIds = new Set(
    previousAchievements
      .filter((achievement) => achievement.isUnlocked)
      .map((achievement) => achievement.id),
  );

  return nextAchievements
    .filter(
      (achievement) =>
        achievement.isUnlocked && !previouslyUnlockedIds.has(achievement.id),
    );
}
