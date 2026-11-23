import type { Prisma } from '../../../src/generated/prisma/client';
import type { VocabularySeedContent } from './vocabulary-seed.types';

/**
 * Replaces the selected lesson variant's vocabulary inside its seed transaction.
 * @param transaction - Active thematic lesson seed transaction.
 * @param variantId - Variant receiving the vocabulary.
 * @param vocabulary - Validated cards, stages and exercises in display order.
 * @returns Resolves after writing the vocabulary and its ordered relations.
 * @example
 * await seedVariantVocabulary(transaction, variant.id, vocabulary);
 */
export async function seedVariantVocabulary(
  transaction: Prisma.TransactionClient,
  variantId: string,
  vocabulary: VocabularySeedContent,
): Promise<void> {
  await transaction.vocabularyLessonStage.deleteMany({
    where: { variantId },
  });
  await transaction.vocabularyLessonWord.deleteMany({
    where: { variantId },
  });
  await transaction.vocabularyLessonWord.createMany({
    data: vocabulary.words.map((word) => ({ ...word, variantId })),
  });
  for (const [position, stage] of vocabulary.stages.entries()) {
    await transaction.vocabularyLessonStage.create({
      data: {
        variantId,
        id: stage.id,
        position,
        kind: stage.kind,
        translations: { create: stage.translations },
      },
    });
    await transaction.vocabularyStageWord.createMany({
      data: stage.wordIds.map((wordId, wordPosition) => ({
        variantId,
        stageId: stage.id,
        wordId,
        position: wordPosition,
      })),
    });
    for (const [exercisePosition, exercise] of stage.exercises.entries()) {
      const sentence =
        exercise.kind === 'sentence_gap'
          ? {
              sentenceBefore: exercise.sentenceBefore,
              sentenceAfter: exercise.sentenceAfter,
              sentenceTranslationUk: exercise.sentenceTranslationUk,
            }
          : {};
      await transaction.vocabularyExercise.create({
        data: {
          variantId,
          id: exercise.id,
          stageId: stage.id,
          position: exercisePosition,
          kind: exercise.kind,
          correctWordId: exercise.correctWordId,
          ...sentence,
          options: {
            create: exercise.optionWordIds.map((wordId, optionPosition) => ({
              wordId,
              position: optionPosition,
            })),
          },
        },
      });
    }
  }
}
