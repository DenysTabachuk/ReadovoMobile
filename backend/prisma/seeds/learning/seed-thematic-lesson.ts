import type { PrismaClient } from '../../../src/generated/prisma/client';
import type { LearningSeed } from './types';
import { seedVariantVocabulary } from './seed-variant-vocabulary';
import { validateVocabularySeed } from './validate-vocabulary-seed';

/**
 * Seeds an A1 sample topic and lesson with vocabulary and reading comprehension.
 * @param prisma - Explicitly configured development database client.
 * @param sample - Authored test content with reserved, stable identities.
 * @param vocabularyInput - Vocabulary content validated before writing.
 * @returns Resolves after saving the sample and replacing its reading questions.
 * @example
 * await seedThematicLesson(prisma, OKTOBERFEST_THEMATIC_LESSON_SEED, OKTOBERFEST_VOCABULARY_SEED);
 * // The Germany topic contains the Oktoberfest A1 lesson with reading questions.
 */
export async function seedThematicLesson(
  prisma: PrismaClient,
  sample: LearningSeed,
  vocabularyInput: unknown,
): Promise<void> {
  const vocabulary = validateVocabularySeed(vocabularyInput);
  await prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('learning-sample-import', 0))`;
    const conflictingTopic = await transaction.learningTopic.findFirst({
      where: {
        OR: [
          { slug: sample.topicSlug, id: { not: sample.topicId } },
          { id: sample.topicId, slug: { not: sample.topicSlug } },
        ],
      },
    });
    const conflictingLesson = await transaction.learningLesson.findFirst({
      where: {
        OR: [
          { slug: sample.lessonSlug, id: { not: sample.lessonId } },
          { id: sample.lessonId, slug: { not: sample.lessonSlug } },
        ],
      },
    });
    if (conflictingTopic || conflictingLesson)
      throw new Error(
        'Learning sample identity conflicts with existing content.',
      );
    await transaction.learningTopic.upsert({
      where: { id: sample.topicId },
      create: {
        id: sample.topicId,
        slug: sample.topicSlug,
        coverImageKey: sample.coverImageKey,
        position: sample.position,
        publishedAt: new Date(),
      },
      update: {
        coverImageKey: sample.coverImageKey,
        position: sample.position,
      },
    });
    for (const copy of sample.topicTranslations)
      await transaction.learningTopicTranslation.upsert({
        where: {
          topicId_locale: { topicId: sample.topicId, locale: copy.locale },
        },
        create: { topicId: sample.topicId, ...copy },
        update: copy,
      });
    await transaction.learningLesson.upsert({
      where: { id: sample.lessonId },
      create: {
        id: sample.lessonId,
        slug: sample.lessonSlug,
        topicId: sample.topicId,
        position: 0,
      },
      update: {},
    });
    for (const copy of sample.lessonTranslations)
      await transaction.learningLessonTranslation.upsert({
        where: {
          lessonId_locale: { lessonId: sample.lessonId, locale: copy.locale },
        },
        create: { lessonId: sample.lessonId, ...copy },
        update: copy,
      });
    const reading = {
      readingTitle: sample.readingTitle,
      readingParagraphs: sample.readingParagraphs,
    };
    const variant = await transaction.learningLessonVariant.upsert({
      where: { lessonId_level: { lessonId: sample.lessonId, level: 'A1' } },
      create: {
        id: sample.variantId,
        lessonId: sample.lessonId,
        level: 'A1',
        publishedAt: new Date(),
        ...reading,
      },
      update: reading,
    });
    if (variant.id !== sample.variantId)
      throw new Error(
        'Learning sample variant conflicts with existing content.',
      );
    await seedVariantVocabulary(transaction, variant.id, vocabulary);
    // Replace the question set so reruns also remove questions dropped from the sample.
    await transaction.learningReadingQuestion.deleteMany({
      where: { lessonId: sample.lessonId, level: 'A1' },
    });
    for (const [position, question] of sample.questions.entries()) {
      await transaction.learningReadingQuestion.create({
        data: {
          lessonId: sample.lessonId,
          level: 'A1',
          id: question.id,
          position,
          prompt: question.prompt,
          explanation: question.explanation,
          options: {
            create: question.options.map((text, optionPosition) => ({
              id: `option-${optionPosition + 1}`,
              position: optionPosition,
              text,
              isCorrect: optionPosition === question.correctOptionPosition,
            })),
          },
        },
      });
    }
  });
}
