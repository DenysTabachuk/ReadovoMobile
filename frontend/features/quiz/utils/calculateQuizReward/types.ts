export type QuizRewardLevel = 'A1' | 'A2' | 'B1' | 'B2';
export type QuizRewardTargetLength = 'short' | 'medium' | 'long';

export type QuizRewardContext = {
  isFirstTestCompleted?: boolean;
  level?: QuizRewardLevel;
  percentage: number;
  targetLength?: QuizRewardTargetLength;
};
