import { type SimplifyArticleLevel, type SimplifyArticleTargetLength } from '@/api/wikipedia';

export type QuizRewardContext = {
  isFirstTestCompleted?: boolean;
  level?: SimplifyArticleLevel;
  percentage: number;
  targetLength?: SimplifyArticleTargetLength;
};

const BASE_REWARD = 20;
const FIRST_TEST_BONUS = 10;
const PERFECT_RESULT_BONUS = 10;

const LEVEL_MULTIPLIERS: Record<SimplifyArticleLevel, number> = {
  A1: 1,
  A2: 1.2,
  B1: 1.5,
  B2: 1.9,
};

const LENGTH_MULTIPLIERS: Record<SimplifyArticleTargetLength, number> = {
  short: 1,
  medium: 1.2,
  long: 1.5,
};

export function calculateQuizReward({
  isFirstTestCompleted = false,
  level,
  percentage,
  targetLength,
}: QuizRewardContext): number {
  const multiplierReward =
    BASE_REWARD *
    getAccuracyMultiplier(percentage) *
    (level ? LEVEL_MULTIPLIERS[level] : 1) *
    (targetLength ? LENGTH_MULTIPLIERS[targetLength] : 1);
  const bonuses =
    (isFirstTestCompleted ? FIRST_TEST_BONUS : 0) +
    (percentage === 100 ? PERFECT_RESULT_BONUS : 0);

  return Math.max(0, Math.round(multiplierReward + bonuses));
}

function getAccuracyMultiplier(percentage: number): number {
  if (percentage < 40) {
    return 0.5;
  }

  if (percentage < 60) {
    return 0.8;
  }

  if (percentage < 75) {
    return 1;
  }

  if (percentage < 90) {
    return 1.3;
  }

  return 1.6;
}
