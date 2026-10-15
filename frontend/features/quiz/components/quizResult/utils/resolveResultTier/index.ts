import { type ResultTier } from '../../types';

export function resolveResultTier(percentage: number): ResultTier {
  if (percentage >= 80) {
    return 'good';
  }

  if (percentage >= 50) {
    return 'normal';
  }

  return 'poor';
}
