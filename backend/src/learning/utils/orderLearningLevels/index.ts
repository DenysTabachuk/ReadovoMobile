import type { VocabularyLevel } from '../../../generated/prisma/enums';
import { CATALOGUE_LEARNING_LEVELS } from '../../constants';

/**
 * Lists available levels in the order supported by the catalogue.
 * @param levels The stored levels across published lesson variants.
 * @returns The unique supported levels in catalogue order.
 * @example
 * orderLearningLevels(['B1', 'A1', 'A1', 'C1']); // => ['A1', 'B1']
 */
export function orderLearningLevels(levels: VocabularyLevel[]) {
  return CATALOGUE_LEARNING_LEVELS.filter((level) => levels.includes(level));
}
