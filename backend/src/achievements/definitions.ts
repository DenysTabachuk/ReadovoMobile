import { type AchievementId, type UserProgress } from './types';

type AchievementDefinition = {
  id: AchievementId;
  isUnlocked: (progress: UserProgress) => boolean;
};

export const achievementDefinitions: AchievementDefinition[] = [
  {
    id: 'first_test_completed',
    isUnlocked: (progress) => progress.testsCompleted >= 1,
  },
  {
    id: 'ten_lessons_completed',
    isUnlocked: (progress) => progress.testsCompleted >= 10,
  },
  {
    id: 'ten_words_learned',
    isUnlocked: (progress) => progress.wordsLearned >= 10,
  },
  {
    id: 'first_thousand_coins',
    isUnlocked: (progress) => progress.balance >= 1000,
  },
];
