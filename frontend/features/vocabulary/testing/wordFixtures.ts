import type { VocabularyLessonWord } from '@/api/generated/transport';

const SAMPLE_WORD_COUNT = 20;

/**
 * Builds fresh test vocabulary cards for an example thematic lesson.
 * @returns Twenty cards with stable IDs and sample image metadata.
 * @example
 * createVocabularyWords().length; // => 20
 */
export function createVocabularyWords(): VocabularyLessonWord[] {
  return Array.from({ length: SAMPLE_WORD_COUNT }, (_, index) => ({
    id: `word-${index + 1}`,
    word: `Sample word ${index + 1}`,
    transcription: '/sample/',
    translationUk: `Translation ${index + 1}`,
    example: `Example ${index + 1}`,
    exampleTranslationUk: `Translated example ${index + 1}`,
    imageKey: `vocabulary/sample/word-${index + 1}/v1.png`,
    imageUrl: `/learning/media?key=vocabulary%2Fsample%2Fword-${index + 1}%2Fv1.png`,
    imageSourceUrl: 'https://example.test/illustration',
    imageLicense: 'CC BY 4.0',
    imageAttribution: 'Sample artist',
  }));
}
