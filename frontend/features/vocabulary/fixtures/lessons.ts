// Local presentation fixtures for UI review. No saved progress or answer keys.
export const COMMON_THINGS_LESSON_ID = 'common-things';
const WORDS_PER_LEARNING_BLOCK = 10;
const LEARNING_BLOCK_COUNT = 2;

export const DEMO_LESSONS = [
  {
    id: COMMON_THINGS_LESSON_ID,
    titleKey: 'vocabulary.commonThings.title',
    descriptionKey: 'vocabulary.commonThings.description',
    level: 'A1',
    wordCount: WORDS_PER_LEARNING_BLOCK * LEARNING_BLOCK_COUNT,
    image: require('../../../assets/images/learning/vocabulary.png'),
    stages: [
      {
        id: 'learn-first',
        titleKey: 'vocabulary.stages.learnFirst',
        descriptionKey: 'vocabulary.stages.firstWords',
        wordCount: WORDS_PER_LEARNING_BLOCK,
        icon: 'style',
      },
      {
        id: 'practise-first',
        titleKey: 'vocabulary.stages.quickPractice',
        descriptionKey: 'vocabulary.stages.matchPictures',
        wordCount: WORDS_PER_LEARNING_BLOCK,
        icon: 'extension',
      },
      {
        id: 'listen-first',
        titleKey: 'vocabulary.audio.title',
        descriptionKey: 'vocabulary.stages.matchAudio',
        wordCount: WORDS_PER_LEARNING_BLOCK,
        icon: 'hearing',
      },
      {
        id: 'learn-second',
        titleKey: 'vocabulary.stages.learnMore',
        descriptionKey: 'vocabulary.stages.moreWords',
        wordCount: WORDS_PER_LEARNING_BLOCK,
        icon: 'menu-book',
      },
      {
        id: 'practise-all',
        titleKey: 'vocabulary.stages.finalChallenge',
        descriptionKey: 'vocabulary.stages.mixedExercises',
        wordCount: WORDS_PER_LEARNING_BLOCK * LEARNING_BLOCK_COUNT,
        icon: 'emoji-events',
      },
    ],
  },
] as const;

export type VocabularyLesson = (typeof DEMO_LESSONS)[number];
