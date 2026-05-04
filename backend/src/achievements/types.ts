export type AchievementId =
  | 'first_test_completed'
  | 'ten_lessons_completed'
  | 'ten_words_learned'
  | 'first_thousand_coins';

export type UserProgress = {
  balance: number;
  lessonsCompleted: number;
  testsCompleted: number;
  wordsLearned: number;
};

export type AchievementStatus = {
  claimedAt: string | null;
  id: AchievementId;
  isClaimed: boolean;
  isUnlocked: boolean;
  unlockedAt: string | null;
};

export type AchievementsProfileResponse = {
  achievements: AchievementStatus[];
  progress: UserProgress;
  userId: string;
};

export type UpdateProgressDto = Partial<UserProgress>;
