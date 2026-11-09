import type { PrismaClient } from '../../../src/generated/prisma/client';
import { validateVocabularySeed } from './validate';

/**
 * Atomically replaces one test seed lesson, keeping it unpublished with stable IDs.
 * @param prisma - Connected Prisma client; no application providers are required.
 * @param input - Untrusted content validated before starting the transaction.
 * @returns Imported lesson ID. Repeating the same import creates no duplicates.
 * Throws if either identity belongs to a published or different lesson; failures roll back all writes.
 * @example
 * await importVocabularySeed(prisma, commonThings); // Imports the lesson as an unpublished draft.
 */
export async function importVocabularySeed(
  prisma: PrismaClient,
  input: unknown,
): Promise<string> {
  const lesson = validateVocabularySeed(input);
  return prisma.$transaction(async (transaction) => {
    // Serializes imports for this slug, including the first import with no row yet.
    await transaction.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtextextended(${lesson.slug}, 0))`;
    await transaction.$queryRaw`SELECT id FROM vocabulary_lessons WHERE id = ${lesson.id}::uuid OR slug = ${lesson.slug} FOR UPDATE`;
    const existing = await transaction.vocabularyLesson.findMany({
      where: { OR: [{ id: lesson.id }, { slug: lesson.slug }] },
    });
    for (const stored of existing) {
      if (stored.publishedAt)
        throw new Error('Cannot replace a published lesson');
      if (stored.id !== lesson.id || stored.slug !== lesson.slug)
        throw new Error('Lesson identity conflicts with existing content');
    }
    await transaction.vocabularyLesson.upsert({
      where: { id: lesson.id },
      create: { id: lesson.id, slug: lesson.slug, level: lesson.level },
      update: { level: lesson.level },
    });
    await transaction.vocabularyLessonStage.deleteMany({
      where: { lessonId: lesson.id },
    });
    await transaction.vocabularyLessonWord.deleteMany({
      where: { lessonId: lesson.id },
    });
    await transaction.vocabularyLessonTranslation.deleteMany({
      where: { lessonId: lesson.id },
    });
    await transaction.vocabularyLessonTranslation.createMany({
      data: lesson.translations.map((copy) => ({
        ...copy,
        lessonId: lesson.id,
      })),
    });
    await transaction.vocabularyLessonWord.createMany({
      data: lesson.words.map((word) => ({ ...word, lessonId: lesson.id })),
    });
    for (const [position, stage] of lesson.stages.entries()) {
      await transaction.vocabularyLessonStage.create({
        data: {
          lessonId: lesson.id,
          id: stage.id,
          position,
          kind: stage.kind,
          translations: { create: stage.translations },
        },
      });
      await transaction.vocabularyStageWord.createMany({
        data: stage.wordIds.map((wordId, wordPosition) => ({
          lessonId: lesson.id,
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
            lessonId: lesson.id,
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
    return lesson.id;
  });
}
