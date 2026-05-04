export type AchievementId =
  | 'first_test_completed'
  | 'ten_lessons_completed'
  | 'ten_words_learned'
  | 'first_thousand_coins';

export type AchievementStatus = {
  claimedAt: string | null;
  id: AchievementId;
  isClaimed: boolean;
  isUnlocked: boolean;
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
