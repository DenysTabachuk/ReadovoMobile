import type { AchievementsProfileResponse } from '@/features/achievements';
import type { StreakState } from '@/features/streak';

export type SubmitQuizAnswerRequest = {
  sessionId: string;
  questionId: string;
  selectedOptionIds: string[];
};

export type QuizCompletionResponse = {
  sessionId: string;
  replayed: boolean;
  completion: {
    correctAnswers: number;
    totalQuestions: number;
    percentage: number;
    rewards: {
      quizCoins: number;
      achievementCoins: number;
      streakCoins: number;
      totalCoins: number;
    };
    newlyUnlockedAchievementIds: string[];
    newlyUnlockedStreakMilestones: number[];
    shouldShowStreakBanner: boolean;
  };
  profile: AchievementsProfileResponse;
  streak: StreakState;
};
