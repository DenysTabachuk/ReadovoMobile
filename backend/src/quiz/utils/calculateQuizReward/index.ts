import type { QuizLength, QuizLevel } from '../../types';

type RewardInput = {
  percentage: number;
  firstTest?: boolean;
  level?: QuizLevel | null;
  targetLength?: QuizLength | null;
};

const BASE_REWARD_COINS = 20;
const FIRST_TEST_BONUS_COINS = 10;
const PERFECT_RESULT_BONUS_COINS = 10;
const PERFECT_RESULT_PERCENTAGE = 100;
const LOWEST_ACCURACY_MULTIPLIER = 0.5;

const LEVEL_MULTIPLIERS = { A1: 1, A2: 1.2, B1: 1.5, B2: 1.9, C1: 1.9 };
const LENGTH_MULTIPLIERS = { short: 1, medium: 1.2, long: 1.5 };
const ACCURACY_TIERS = [
  { minimum: 90, multiplier: 1.6 },
  { minimum: 75, multiplier: 1.3 },
  { minimum: 60, multiplier: 1 },
  { minimum: 40, multiplier: 0.8 },
];

/**
 * Calculates the existing quiz reward from server-graded accuracy and saved settings.
 * C1 uses the highest existing reward tier; dictionary quizzes omit difficulty/length.
 * @param input - Server-graded percentage (0–100), saved settings, and transactionally determined first-test eligibility.
 * @returns Rounded non-negative quiz coins, including first-test and perfect-score bonuses.
 * @example calculateQuizReward({ percentage: 100, firstTest: true }); // => 52
 */
export function calculateQuizReward(input: RewardInput): number {
  let accuracy = LOWEST_ACCURACY_MULTIPLIER;
  for (const tier of ACCURACY_TIERS) {
    if (input.percentage >= tier.minimum) {
      accuracy = tier.multiplier;
      break;
    }
  }
  const reward =
    BASE_REWARD_COINS *
    accuracy *
    (input.level ? LEVEL_MULTIPLIERS[input.level] : 1) *
    (input.targetLength ? LENGTH_MULTIPLIERS[input.targetLength] : 1);
  const bonuses =
    (input.firstTest ? FIRST_TEST_BONUS_COINS : 0) +
    (input.percentage === PERFECT_RESULT_PERCENTAGE
      ? PERFECT_RESULT_BONUS_COINS
      : 0);
  return Math.round(reward + bonuses);
}
