import type {
  GetLearningCatalogueResponse,
  GetLearningLessonResponse,
} from '@/api/generated/transport';
import { createVocabularyWords } from '../../vocabulary/testing/wordFixtures';
import { createVocabularyPractice } from '../../vocabulary/testing/practiceFixtures';

/** Creates a fresh catalogue response with one topic and its available levels. */
export function createCatalogue(): GetLearningCatalogueResponse {
  return {
    supportedLevels: ['A1', 'A2', 'B1', 'B2'],
    defaultLevel: 'A1',
    topic: null,
    topics: [
      {
        slug: 'everyday',
        coverImageKey: null,
        title: 'Everyday life',
        description: 'One theme',
        availableLevels: ['A1', 'B2'],
      },
    ],
    lessons: [],
  };
}

/** Creates a coherent thematic sample containing existing cards and prepared reading. */
export function createLesson(): GetLearningLessonResponse {
  return {
    slug: 'a-day',
    coverImageKey: null,
    topicSlug: 'everyday',
    title: 'Anna’s day',
    description: 'Words and reading together',
    supportedLevels: createCatalogue().supportedLevels,
    availableLevels: ['A1'],
    variant: {
      level: 'A1',
      vocabulary: {
        words: createVocabularyWords(),
        ...createVocabularyPractice(),
      },
      readingTitle: 'A rainy day',
      readingParagraphs: ['Anna takes an umbrella because it is raining.'],
      questions: [
        {
          id: 'weather',
          prompt: 'Why does Anna take an umbrella?',
          options: [
            { id: 'rain', text: 'It is raining' },
            { id: 'sun', text: 'It is sunny' },
          ],
        },
      ],
    },
  };
}
