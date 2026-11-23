import type { LearningSeed } from './types';

// Original fictional visit for a development lesson, not production-approved content.
// Context checked against https://www.muenchen.de/en/events/oktoberfest
// and https://www.munich.travel/en/topics/markets-festivals/oktoberfest/which-beer-tent-is-the-right-one-for-me
export const OKTOBERFEST_THEMATIC_LESSON_SEED: LearningSeed = {
  topicId: 'f276e561-078e-4a94-924c-8df97108fa02',
  lessonId: 'f276e561-078e-4a94-924c-8df97108fa03',
  topicSlug: 'seed-germany',
  lessonSlug: 'seed-oktoberfest',
  variantId: 'f276e561-078e-4a94-924c-8df97108fa01',
  coverImageKey: 'learning/topics/germany/v2.webp',
  topicThumbnailImageKey: 'learning/topics/germany/catalogue/v1.webp',
  thumbnailImageKey: 'learning/lessons/oktoberfest/thumbnail/v1.webp',
  readingImageKey: 'learning/lessons/oktoberfest/reading/v2.webp',
  resultsImageKey: 'learning/lessons/oktoberfest/questions/v2.webp',
  position: 0,
  topicTranslations: [
    {
      locale: 'en',
      title: 'Germany',
      description:
        'Discover Germany through its cities, stories and traditions.',
    },
    {
      locale: 'uk',
      title: 'Німеччина',
      description: 'Відкривайте Німеччину через міста, історії та традиції.',
    },
  ],
  lessonTranslations: [
    {
      locale: 'en',
      title: 'Oktoberfest',
      description:
        'A day in Munich: festival words, a short story and practice.',
    },
    {
      locale: 'uk',
      title: 'Октоберфест',
      description:
        'День у Мюнхені: слова фестивалю, коротка історія та практика.',
    },
  ],
  readingTitle: 'A day at Oktoberfest',
  readingParagraphs: [
    'My name is Emma. Today I visit Oktoberfest with my friend Ben. It is a big festival in Munich, a city in Germany. We go to Munich by train. I keep my ticket in my bag.',
    'At the festival, we see a blue and white flag. Ben wears a green hat. We walk into a big tent. A band plays music, and people dance. One woman wears a beautiful blue dress.',
    'We sit on a long bench at a table. I eat a warm pretzel, and Ben eats a sausage. The food is good. My drink is apple juice. A family sits next to us. Their children want to go on a ride.',
    'After lunch, we go outside and watch a ride. Ben wants to dance again, but I want to listen to the band. We go back to the tent together. At the end of the day, we take the train home. I am tired, but happy.',
  ],
  questions: [
    {
      id: 'travel',
      prompt: 'How do Emma and Ben get to Munich?',
      options: ['By train', 'By car', 'By plane'],
      correctOptionPosition: 0,
      explanation: 'Emma says, “We go to Munich by train.”',
    },
    {
      id: 'hat',
      prompt: 'What does Ben wear?',
      options: ['A blue dress', 'A green hat', 'A white hat'],
      correctOptionPosition: 1,
      explanation: 'The second paragraph says Ben wears a green hat.',
    },
    {
      id: 'food',
      prompt: 'What does Emma eat?',
      options: ['A sausage', 'An apple', 'A warm pretzel'],
      correctOptionPosition: 2,
      explanation: 'Emma eats a warm pretzel. Ben eats a sausage.',
    },
    {
      id: 'return',
      prompt: 'Why do they go back to the tent?',
      options: [
        'Ben wants to dance and Emma wants to hear the band',
        'They need train tickets',
        'Emma wants another pretzel',
      ],
      correctOptionPosition: 0,
      explanation:
        'Ben wants to dance again, and Emma wants to listen to the band.',
    },
    {
      id: 'feeling',
      prompt: 'How does Emma feel at the end of the day?',
      options: ['Angry and hungry', 'Tired but happy', 'Cold and sad'],
      correctOptionPosition: 1,
      explanation: 'The final sentence says, “I am tired, but happy.”',
    },
  ],
};
