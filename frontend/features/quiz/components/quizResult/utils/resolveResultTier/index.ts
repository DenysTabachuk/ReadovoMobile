import { type ResultTier } from '../../types';

const GOOD_RESULT_MIN_PERCENTAGE = 80;
const NORMAL_RESULT_MIN_PERCENTAGE = 50;

export function resolveResultTier(percentage: number): ResultTier {
  if (percentage >= GOOD_RESULT_MIN_PERCENTAGE) {
    return 'good';
  }

  if (percentage >= NORMAL_RESULT_MIN_PERCENTAGE) {
    return 'normal';
  }

  return 'poor';
}
