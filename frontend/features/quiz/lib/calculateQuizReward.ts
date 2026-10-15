type QuizRewardLevel = 'A1' | 'A2' | 'B1' | 'B2';
type QuizRewardTargetLength = 'short' | 'medium' | 'long';

export type QuizRewardContext = {
  isFirstTestCompleted?: boolean;
  level?: QuizRewardLevel;
  percentage: number;
  targetLength?: QuizRewardTargetLength;
};

const BASE_REWARD = 20;
const FIRST_TEST_BONUS = 10;
const PERFECT_RESULT_BONUS = 10;
const PERFECT_RESULT_PERCENTAGE = 100;

const ACCURACY_MULTIPLIER_TIERS = [
  { minimumPercentage: 90, multiplier: 1.6 },
  { minimumPercentage: 75, multiplier: 1.3 },
  { minimumPercentage: 60, multiplier: 1 },
  { minimumPercentage: 40, multiplier: 0.8 },
] as const;
const LOWEST_ACCURACY_MULTIPLIER = 0.5;

const LEVEL_MULTIPLIERS: Record<QuizRewardLevel, number> = {
  A1: 1,
  A2: 1.2,
  B1: 1.5,
  B2: 1.9,
};

const LENGTH_MULTIPLIERS: Record<QuizRewardTargetLength, number> = {
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
    (percentage === PERFECT_RESULT_PERCENTAGE ? PERFECT_RESULT_BONUS : 0);

  return Math.max(0, Math.round(multiplierReward + bonuses));
}

function getAccuracyMultiplier(percentage: number): number {
  return (
    ACCURACY_MULTIPLIER_TIERS.find(
      ({ minimumPercentage }) => percentage >= minimumPercentage,
    )?.multiplier ?? LOWEST_ACCURACY_MULTIPLIER
  );
}
