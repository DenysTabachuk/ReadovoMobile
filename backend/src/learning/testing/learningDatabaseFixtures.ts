import type { VocabularyLevel } from '../../generated/prisma/enums';

const TOPIC_ID = '11111111-1111-4111-8111-111111111111';
const CHILD_ID = '22222222-2222-4222-8222-222222222222';
const LESSON_ID = '33333333-3333-4333-8333-333333333333';

export const A2_VARIANT_ID = '55555555-5555-4555-8555-555555555555';
export const B2_VARIANT_ID = '66666666-6666-4666-8666-666666666666';

/** Creates a published parent topic and a published child for catalogue tests. */
export function createTopics() {
  return [
    {
      id: TOPIC_ID,
      slug: 'germany',
      coverImageKey: 'learning/topics/germany/v1.png',
      parentId: null,
      position: 0,
      publishedAt: new Date(),
      translations: [
        { locale: 'en', title: 'Germany', description: 'Explore Germany' },
        {
          locale: 'uk',
          title: 'Німеччина',
          description: 'Досліджуйте Німеччину',
        },
      ],
    },
    {
      id: CHILD_ID,
      slug: 'festivals',
      coverImageKey: null,
      parentId: TOPIC_ID,
      position: 0,
      publishedAt: new Date(),
      translations: [
        { locale: 'en', title: 'Festivals', description: 'Local festivals' },
      ],
    },
  ];
}

/** Creates the Oktoberfest lesson under the child topic with A2 and B2 variants. */
export function createLessons() {
  return [
    {
      id: LESSON_ID,
      slug: 'oktoberfest',
      topicId: CHILD_ID,
      position: 0,
      translations: [
        {
          locale: 'en',
          title: 'Oktoberfest',
          description: 'One topic at different levels',
        },
      ],
      variants: [{ level: 'A2' }, { level: 'B2' }],
    },
  ];
}

/**
 * Creates a variant with reading content and one graded comprehension question.
 * @param level - Variant level. Defaults to A2.
 * @returns A fresh Prisma-shaped variant for the learning HTTP suite.
 * @example
 * createVariant('B2').id; // => B2_VARIANT_ID
 */
export function createVariant(level: VocabularyLevel = 'A2') {
  return {
    lessonId: LESSON_ID,
    level,
    id: level === 'B2' ? B2_VARIANT_ID : A2_VARIANT_ID,
    readingTitle: `Reading ${level}`,
    readingParagraphs: [
      level === 'B2'
        ? 'Although it was raining, Anna continued her journey.'
        : 'It is raining. Anna has an umbrella.',
    ],
    questions: [
      {
        id: 'rain',
        prompt: 'What is the weather like?',
        explanation: 'The text says that it is raining.',
        position: 0,
        options: [
          { id: 'rainy', text: 'Rainy', position: 0, isCorrect: true },
          { id: 'sunny', text: 'Sunny', position: 1, isCorrect: false },
        ],
      },
    ],
  };
}
