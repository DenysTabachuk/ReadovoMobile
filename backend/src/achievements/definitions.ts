import { type AchievementId, type UserProgress } from './types';

type AchievementDefinition = {
  badgeKey: string;
  coinsReward: number;
  descriptionKey: string;
  getProgressValue: (progress: UserProgress) => number;
  id: AchievementId;
  isUnlocked: (progress: UserProgress) => boolean;
  targetValue: number;
  titleKey: string;
};

export const achievementDefinitions: AchievementDefinition[] = [
  {
    badgeKey: 'first-test-completed',
    coinsReward: 50,
    descriptionKey: 'profile.achievements.first_test_completed.description',
    getProgressValue: (progress) => progress.testsCompleted,
    id: 'first_test_completed',
    isUnlocked: (progress) => progress.testsCompleted >= 1,
    targetValue: 1,
    titleKey: 'profile.achievements.first_test_completed.title',
  },
  {
    badgeKey: 'first-test-completed',
    coinsReward: 100,
    descriptionKey: 'profile.achievements.ten_tests_completed.description',
    getProgressValue: (progress) => progress.testsCompleted,
    id: 'ten_tests_completed',
    isUnlocked: (progress) => progress.testsCompleted >= 10,
    targetValue: 10,
    titleKey: 'profile.achievements.ten_tests_completed.title',
  },
  {
    badgeKey: 'first-test-completed',
    coinsReward: 100,
    descriptionKey: 'profile.achievements.ten_words_learned.description',
    getProgressValue: (progress) => progress.wordsLearned,
    id: 'ten_words_learned',
    isUnlocked: (progress) => progress.wordsLearned >= 10,
    targetValue: 10,
    titleKey: 'profile.achievements.ten_words_learned.title',
  },
  {
    badgeKey: 'first-test-completed',
    coinsReward: 200,
    descriptionKey: 'profile.achievements.first_thousand_coins.description',
    getProgressValue: (progress) => progress.balance,
    id: 'first_thousand_coins',
    isUnlocked: (progress) => progress.balance >= 1000,
    targetValue: 1000,
    titleKey: 'profile.achievements.first_thousand_coins.title',
  },
];
