import type { ArticleBlock } from '@/features/articles/api';
import type { ArticleSimplificationMetrics } from '../../../../../../types';
import {
  extractTextFromArticleBlocks,
  getTextComplexityMetrics,
} from '../../../../../../utils';

/**
 * Compare the original article text with the readable text of transformed blocks.
 *
 * @param originalText - Original article content; empty content produces zero metrics.
 * @param adaptedBlocks - Transformed blocks; inputs are not mutated.
 * @returns Independent original/adapted text-size and sentence/word metrics.
 * @example
 * compareArticleTextMetrics('Hi all.', []).original.wordCount;
 * // => 2
 */
export function compareArticleTextMetrics(
  originalText: string,
  adaptedBlocks: ArticleBlock[],
): ArticleSimplificationMetrics {
  return {
    original: getTextComplexityMetrics(originalText),
    adapted: getTextComplexityMetrics(
      extractTextFromArticleBlocks(adaptedBlocks),
    ),
  };
}
