import { type ImageSourcePropType } from 'react-native';

const achievementBadges: Record<string, ImageSourcePropType> = {
  'first-test-completed': require('../../assets/images/first-test-completed-badge.png'),
};

export function getAchievementBadge(badgeKey: string): ImageSourcePropType {
  return (
    achievementBadges[badgeKey] ?? achievementBadges['first-test-completed']
  );
}
