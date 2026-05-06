export type AchievementId =
  | 'first_test_completed'
  | 'ten_tests_completed'
  | 'ten_words_learned'
  | 'first_thousand_coins';

export type UserProgress = {
  balance: number;
  lessonsCompleted: number;
  testsCompleted: number;
  wordsLearned: number;
};

export type AchievementStatus = {
  badgeKey: string;
  claimedAt: string | null;
  coinsReward: number;
  descriptionKey: string;
  id: AchievementId;
  isClaimed: boolean;
  isUnlocked: boolean;
  progressValue: number;
  targetValue: number;
  titleKey: string;
  unlockedAt: string | null;
};

export type AchievementsProfileResponse = {
  achievements: AchievementStatus[];
  progress: UserProgress;
  userId: string;
};

export type UpdateProgressDto = Partial<UserProgress>;
