export type AchievementId =
  | 'first_test_completed'
  | 'ten_tests_completed'
  | 'ten_words_learned'
  | 'first_thousand_coins';

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

export type AchievementProgress = {
  balance: number;
  lessonsCompleted: number;
  testsCompleted: number;
  wordsLearned: number;
};

export type AchievementsProfileResponse = {
  achievements: AchievementStatus[];
  progress: AchievementProgress;
  userId: string;
};

export type UpdateAchievementProgressDto = Partial<AchievementProgress>;
