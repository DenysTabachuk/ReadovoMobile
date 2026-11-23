import type { VocabularyExerciseKind } from '../../../generated/prisma/client';

export const VARIANT_ID = '91a160f2-8ae8-49dc-b105-3572ca4d7610';
const practiceKinds = new Map<string, VocabularyExerciseKind[]>([
  ['practise-first', ['word_to_picture', 'word_to_picture']],
  ['listen-first', ['audio_to_picture', 'audio_to_picture']],
  ['sentences-first', ['sentence_gap', 'sentence_gap']],
  ['practise-all', ['word_to_picture', 'audio_to_picture', 'sentence_gap']],
]);
const wordExamples = [
  {
    id: 'book',
    transcription: '/bʊk/',
    translationUk: 'книга',
    exampleTranslationUk: 'У мене є книга.',
  },
  {
    id: 'pencil',
    transcription: '/ˈpen.səl/',
    translationUk: 'олівець',
    exampleTranslationUk: 'У мене є олівець.',
  },
];

/**
 * Builds fresh persistence rows for a practice API test.
 * @param stageId - Known test stage ID.
 * @returns A stage with ordered words and exercises. Throws for unknown IDs.
 * @example
 * createPracticeStage('practise-all').exercises.length; // => 3
 */
export function createPracticeStage(stageId: string, variantId = VARIANT_ID) {
  const kinds = practiceKinds.get(stageId);
  if (!kinds) throw new Error('Unknown test stage');

  const wordRows = wordExamples.map((word) => ({
    ...word,
    variantId,
    word: word.id,
    example: `I have a ${word.id}.`,
    imageKey: `vocabulary/test/${word.id}.png`,
    imageSourceUrl: 'https://example.test/vocabulary',
    imageLicense: 'Test fixture',
    imageAttribution: 'Test fixture',
  }));
  const words = wordRows.map((word, position) => ({
    variantId,
    stageId,
    wordId: word.id,
    word,
    position,
  }));
  const exercises = kinds.map((kind, position) => {
    const id = `question-${position + 1}`;
    const correctWord = wordRows[position % wordRows.length];
    const isSentence = kind === 'sentence_gap';
    return {
      id,
      variantId,
      stageId,
      position,
      kind,
      correctWordId: correctWord.id,
      correctWord,
      sentenceBefore: isSentence ? 'I have a ' : null,
      sentenceAfter: isSentence ? '.' : null,
      sentenceTranslationUk: isSentence
        ? correctWord.exampleTranslationUk
        : null,
      options: wordRows.map((word, optionPosition) => ({
        variantId,
        exerciseId: id,
        wordId: word.id,
        position: optionPosition,
        word,
      })),
      stage: { words },
    };
  });
  return {
    id: stageId,
    variantId,
    position: 0,
    kind: 'practice' as const,
    words,
    exercises,
  };
}
