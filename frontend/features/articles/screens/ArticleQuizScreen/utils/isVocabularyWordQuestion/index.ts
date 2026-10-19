import type { VocabularyWordQuestion } from '../../types';

/**
 * Check fields needed to save a vocabulary quiz question to the dictionary.
 *
 * @param question - Unknown quiz question from the shared runner.
 * @returns True only for a nonempty string ID, term, and translation, with an optional string excerpt.
 * @example
 * isVocabularyWordQuestion({ id: 'q1', term: 'sun', translation: 'sol' });
 * // => true
 */
export function isVocabularyWordQuestion(
  question: unknown,
): question is VocabularyWordQuestion {
  if (!question || typeof question !== 'object') return false;
  const candidate = question as Partial<VocabularyWordQuestion>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.term === 'string' &&
    candidate.term.length > 0 &&
    typeof candidate.translation === 'string' &&
    candidate.translation.length > 0 &&
    (candidate.sourceExcerpt === undefined ||
      typeof candidate.sourceExcerpt === 'string')
  );
}
