import type { VocabularySeedLesson } from './types';
import type { VocabularyExerciseKind } from '../../../src/generated/prisma/enums';

// Test data for populating development databases; not approved production content.
// Image keys are placeholders for planned assets; no media is uploaded by the seed.
const entries = [
  {
    word: {
      id: 'backpack',
      word: 'Backpack',
      transcription: '/ˈbæk.pæk/',
      translationUk: 'Рюкзак',
      example: 'My backpack is red.',
      exampleTranslationUk: 'Мій рюкзак червоний.',
      imageKey: 'vocabulary/common-things/backpack/v1.svg',
      imageSourceUrl:
        'https://github.com/jdecked/twemoji/blob/main/assets/svg/1f392.svg',
      imageLicense: 'CC BY 4.0',
      imageAttribution:
        'Twemoji graphics by Twitter, Inc. and other contributors',
    },
    sentence: {
      before: 'I carry my books to school in a ',
      after: '.',
      translationUk: 'Я ношу книжки до школи в рюкзаку.',
    },
  },
  {
    word: {
      id: 'book',
      word: 'Book',
      transcription: '/bʊk/',
      translationUk: 'Книжка',
      example: 'This book is about animals.',
      exampleTranslationUk: 'Ця книжка про тварин.',
      imageKey: 'vocabulary/common-things/book/v1.svg',
      imageSourceUrl:
        'https://github.com/jdecked/twemoji/blob/main/assets/svg/1f4d6.svg',
      imageLicense: 'CC BY 4.0',
      imageAttribution:
        'Twemoji graphics by Twitter, Inc. and other contributors',
    },
    sentence: {
      before: 'I read a ',
      after: ' about animals.',
      translationUk: 'Я читаю книжку про тварин.',
    },
  },
  {
    word: {
      id: 'pencil',
      word: 'Pencil',
      transcription: '/ˈpen.səl/',
      translationUk: 'Олівець',
      example: 'I write with a pencil.',
      exampleTranslationUk: 'Я пишу олівцем.',
      imageKey: 'vocabulary/common-things/pencil/v1.svg',
      imageSourceUrl:
        'https://github.com/jdecked/twemoji/blob/main/assets/svg/270f.svg',
      imageLicense: 'CC BY 4.0',
      imageAttribution:
        'Twemoji graphics by Twitter, Inc. and other contributors',
    },
    sentence: {
      before: 'I write with a ',
      after: ' and erase mistakes with an eraser.',
      translationUk: 'Я пишу олівцем і стираю помилки гумкою.',
    },
  },
  {
    word: {
      id: 'pen',
      word: 'Pen',
      transcription: '/pen/',
      translationUk: 'Ручка',
      example: 'This pen has blue ink.',
      exampleTranslationUk: 'У цій ручці синє чорнило.',
      imageKey: 'vocabulary/common-things/pen/v1.svg',
      imageSourceUrl:
        'https://github.com/jdecked/twemoji/blob/main/assets/svg/1f58a.svg',
      imageLicense: 'CC BY 4.0',
      imageAttribution:
        'Twemoji graphics by Twitter, Inc. and other contributors',
    },
    sentence: {
      before: 'This ',
      after: ' has blue ink.',
      translationUk: 'У цій ручці синє чорнило.',
    },
  },
  {
    word: {
      id: 'notebook',
      word: 'Notebook',
      transcription: '/ˈnoʊt.bʊk/',
      translationUk: 'Зошит',
      example: 'I write new words in my notebook.',
      exampleTranslationUk: 'Я записую нові слова у свій зошит.',
      imageKey: 'vocabulary/common-things/notebook/v1.svg',
      imageSourceUrl:
        'https://github.com/jdecked/twemoji/blob/main/assets/svg/1f4d3.svg',
      imageLicense: 'CC BY 4.0',
      imageAttribution:
        'Twemoji graphics by Twitter, Inc. and other contributors',
    },
    sentence: {
      before: 'I write new words in my ',
      after: '.',
      translationUk: 'Я записую нові слова у свій зошит.',
    },
  },
  {
    word: {
      id: 'ruler',
      word: 'Ruler',
      transcription: '/ˈruː.lɚ/',
      translationUk: 'Лінійка',
      example: 'My ruler is thirty centimetres long.',
      exampleTranslationUk: 'Моя лінійка має довжину тридцять сантиметрів.',
      imageKey: 'vocabulary/common-things/ruler/v1.svg',
      imageSourceUrl:
        'https://github.com/jdecked/twemoji/blob/main/assets/svg/1f4cf.svg',
      imageLicense: 'CC BY 4.0',
      imageAttribution:
        'Twemoji graphics by Twitter, Inc. and other contributors',
    },
    sentence: {
      before: 'I draw a straight line with a ',
      after: '.',
      translationUk: 'Я креслю пряму лінію лінійкою.',
    },
  },
  {
    word: {
      id: 'scissors',
      word: 'Scissors',
      transcription: '/ˈsɪz.ɚz/',
      translationUk: 'Ножиці',
      example: 'These scissors are for cutting paper.',
      exampleTranslationUk: 'Ці ножиці призначені для різання паперу.',
      imageKey: 'vocabulary/common-things/scissors/v1.svg',
      imageSourceUrl:
        'https://github.com/jdecked/twemoji/blob/main/assets/svg/2702.svg',
      imageLicense: 'CC BY 4.0',
      imageAttribution:
        'Twemoji graphics by Twitter, Inc. and other contributors',
    },
    sentence: {
      before: 'I cut paper with ',
      after: '.',
      translationUk: 'Я ріжу папір ножицями.',
    },
  },
  {
    word: {
      id: 'key',
      word: 'Key',
      transcription: '/kiː/',
      translationUk: 'Ключ',
      example: 'This key opens my front door.',
      exampleTranslationUk: 'Цей ключ відчиняє мої вхідні двері.',
      imageKey: 'vocabulary/common-things/key/v1.svg',
      imageSourceUrl:
        'https://github.com/jdecked/twemoji/blob/main/assets/svg/1f511.svg',
      imageLicense: 'CC BY 4.0',
      imageAttribution:
        'Twemoji graphics by Twitter, Inc. and other contributors',
    },
    sentence: {
      before: 'I open the front door with a ',
      after: '.',
      translationUk: 'Я відчиняю вхідні двері ключем.',
    },
  },
  {
    word: {
      id: 'door',
      word: 'Door',
      transcription: '/dɔːr/',
      translationUk: 'Двері',
      example: 'Please close the door.',
      exampleTranslationUk: 'Будь ласка, зачиніть двері.',
      imageKey: 'vocabulary/common-things/door/v1.svg',
      imageSourceUrl:
        'https://github.com/jdecked/twemoji/blob/main/assets/svg/1f6aa.svg',
      imageLicense: 'CC BY 4.0',
      imageAttribution:
        'Twemoji graphics by Twitter, Inc. and other contributors',
    },
    sentence: {
      before: 'I walk through the ',
      after: ' to enter the room.',
      translationUk: 'Я проходжу через двері, щоб увійти в кімнату.',
    },
  },
  {
    word: {
      id: 'window',
      word: 'Window',
      transcription: '/ˈwɪn.doʊ/',
      translationUk: 'Вікно',
      example: 'I can see the garden through the window.',
      exampleTranslationUk: 'Я бачу сад крізь вікно.',
      imageKey: 'vocabulary/common-things/window/v1.svg',
      imageSourceUrl:
        'https://github.com/jdecked/twemoji/blob/main/assets/svg/1fa9f.svg',
      imageLicense: 'CC BY 4.0',
      imageAttribution:
        'Twemoji graphics by Twitter, Inc. and other contributors',
    },
    sentence: {
      before: 'I can see the garden through the ',
      after: '.',
      translationUk: 'Я бачу сад крізь вікно.',
    },
  },
  {
    word: {
      id: 'bed',
      word: 'Bed',
      transcription: '/bed/',
      translationUk: 'Ліжко',
      example: 'My bed is next to the window.',
      exampleTranslationUk: 'Моє ліжко стоїть біля вікна.',
      imageKey: 'vocabulary/common-things/bed/v1.svg',
      imageSourceUrl:
        'https://github.com/jdecked/twemoji/blob/main/assets/svg/1f6cf.svg',
      imageLicense: 'CC BY 4.0',
      imageAttribution:
        'Twemoji graphics by Twitter, Inc. and other contributors',
    },
    sentence: {
      before: 'I sleep in my ',
      after: ' at night.',
      translationUk: 'Уночі я сплю у своєму ліжку.',
    },
  },
  {
    word: {
      id: 'chair',
      word: 'Chair',
      transcription: '/tʃer/',
      translationUk: 'Стілець',
      example: 'Please sit on this chair.',
      exampleTranslationUk: 'Будь ласка, сядьте на цей стілець.',
      imageKey: 'vocabulary/common-things/chair/v1.svg',
      imageSourceUrl:
        'https://github.com/jdecked/twemoji/blob/main/assets/svg/1fa91.svg',
      imageLicense: 'CC BY 4.0',
      imageAttribution:
        'Twemoji graphics by Twitter, Inc. and other contributors',
    },
    sentence: {
      before: 'Please sit on this ',
      after: '.',
      translationUk: 'Будь ласка, сядьте на цей стілець.',
    },
  },
  {
    word: {
      id: 'clock',
      word: 'Clock',
      transcription: '/klɑːk/',
      translationUk: 'Годинник',
      example: 'The clock on the wall shows nine.',
      exampleTranslationUk: 'Годинник на стіні показує дев’яту.',
      imageKey: 'vocabulary/common-things/clock/v1.svg',
      imageSourceUrl:
        'https://github.com/jdecked/twemoji/blob/main/assets/svg/1f570.svg',
      imageLicense: 'CC BY 4.0',
      imageAttribution:
        'Twemoji graphics by Twitter, Inc. and other contributors',
    },
    sentence: {
      before: 'The ',
      after: ' on the wall shows nine.',
      translationUk: 'Годинник на стіні показує дев’яту.',
    },
  },
  {
    word: {
      id: 'phone',
      word: 'Phone',
      transcription: '/foʊn/',
      translationUk: 'Телефон',
      example: 'I call my friend on my phone.',
      exampleTranslationUk: 'Я телефоную другові зі свого телефона.',
      imageKey: 'vocabulary/common-things/phone/v1.svg',
      imageSourceUrl:
        'https://github.com/jdecked/twemoji/blob/main/assets/svg/1f4f1.svg',
      imageLicense: 'CC BY 4.0',
      imageAttribution:
        'Twemoji graphics by Twitter, Inc. and other contributors',
    },
    sentence: {
      before: 'I call my friend on my ',
      after: '.',
      translationUk: 'Я телефоную другові зі свого телефона.',
    },
  },
  {
    word: {
      id: 'computer',
      word: 'Computer',
      transcription: '/kəmˈpjuː.tɚ/',
      translationUk: 'Комп’ютер',
      example: 'I do my homework on the computer.',
      exampleTranslationUk: 'Я виконую домашнє завдання на комп’ютері.',
      imageKey: 'vocabulary/common-things/computer/v1.svg',
      imageSourceUrl:
        'https://github.com/jdecked/twemoji/blob/main/assets/svg/1f4bb.svg',
      imageLicense: 'CC BY 4.0',
      imageAttribution:
        'Twemoji graphics by Twitter, Inc. and other contributors',
    },
    sentence: {
      before: 'I type my homework on the ',
      after: '.',
      translationUk: 'Я набираю домашнє завдання на комп’ютері.',
    },
  },
  {
    word: {
      id: 'camera',
      word: 'Camera',
      transcription: '/ˈkæm.rə/',
      translationUk: 'Фотоапарат',
      example: 'I take photos with my camera.',
      exampleTranslationUk: 'Я роблю фотографії своїм фотоапаратом.',
      imageKey: 'vocabulary/common-things/camera/v1.svg',
      imageSourceUrl:
        'https://github.com/jdecked/twemoji/blob/main/assets/svg/1f4f7.svg',
      imageLicense: 'CC BY 4.0',
      imageAttribution:
        'Twemoji graphics by Twitter, Inc. and other contributors',
    },
    sentence: {
      before: 'I take photos with my ',
      after: '.',
      translationUk: 'Я роблю фотографії своїм фотоапаратом.',
    },
  },
  {
    word: {
      id: 'watch',
      word: 'Watch',
      transcription: '/wɑːtʃ/',
      translationUk: 'Наручний годинник',
      example: 'I wear a watch on my wrist.',
      exampleTranslationUk: 'Я ношу годинник на зап’ясті.',
      imageKey: 'vocabulary/common-things/watch/v1.svg',
      imageSourceUrl:
        'https://github.com/jdecked/twemoji/blob/main/assets/svg/231a.svg',
      imageLicense: 'CC BY 4.0',
      imageAttribution:
        'Twemoji graphics by Twitter, Inc. and other contributors',
    },
    sentence: {
      before: 'I wear a ',
      after: ' on my wrist.',
      translationUk: 'Я ношу годинник на зап’ясті.',
    },
  },
  {
    word: {
      id: 'umbrella',
      word: 'Umbrella',
      transcription: '/ʌmˈbrel.ə/',
      translationUk: 'Парасоля',
      example: 'I use an umbrella when it rains.',
      exampleTranslationUk: 'Я користуюся парасолею, коли йде дощ.',
      imageKey: 'vocabulary/common-things/umbrella/v1.svg',
      imageSourceUrl:
        'https://github.com/jdecked/twemoji/blob/main/assets/svg/2602.svg',
      imageLicense: 'CC BY 4.0',
      imageAttribution:
        'Twemoji graphics by Twitter, Inc. and other contributors',
    },
    sentence: {
      before: 'I use an ',
      after: ' when it rains.',
      translationUk: 'Я користуюся парасолею, коли йде дощ.',
    },
  },
  {
    word: {
      id: 'cup',
      word: 'Cup',
      transcription: '/kʌp/',
      translationUk: 'Чашка',
      example: 'This cup is full of tea.',
      exampleTranslationUk: 'Ця чашка повна чаю.',
      imageKey: 'vocabulary/common-things/cup/v1.svg',
      imageSourceUrl:
        'https://github.com/jdecked/twemoji/blob/main/assets/svg/2615.svg',
      imageLicense: 'CC BY 4.0',
      imageAttribution:
        'Twemoji graphics by Twitter, Inc. and other contributors',
    },
    sentence: {
      before: 'I drink tea from a ',
      after: '.',
      translationUk: 'Я п’ю чай із чашки.',
    },
  },
  {
    word: {
      id: 'toothbrush',
      word: 'Toothbrush',
      transcription: '/ˈtuːθ.brʌʃ/',
      translationUk: 'Зубна щітка',
      example: 'I clean my teeth with a toothbrush.',
      exampleTranslationUk: 'Я чищу зуби зубною щіткою.',
      imageKey: 'vocabulary/common-things/toothbrush/v1.svg',
      imageSourceUrl:
        'https://github.com/jdecked/twemoji/blob/main/assets/svg/1faa5.svg',
      imageLicense: 'CC BY 4.0',
      imageAttribution:
        'Twemoji graphics by Twitter, Inc. and other contributors',
    },
    sentence: {
      before: 'I clean my teeth with a ',
      after: '.',
      translationUk: 'Я чищу зуби зубною щіткою.',
    },
  },
];

type PracticeStageInput = {
  id: string;
  translations: VocabularySeedLesson['translations'];
  entries: typeof entries;
  kinds: readonly [VocabularyExerciseKind, ...VocabularyExerciseKind[]];
};

const FIRST_BLOCK_WORD_COUNT = 10;
const firstBlock = entries.slice(0, FIRST_BLOCK_WORD_COUNT);
const secondBlock = entries.slice(FIRST_BLOCK_WORD_COUNT);

function createPracticeStage(
  input: PracticeStageInput,
): VocabularySeedLesson['stages'][number] {
  return {
    id: input.id,
    kind: 'practice',
    translations: input.translations,
    wordIds: input.entries.map((entry) => entry.word.id),
    exercises: input.entries.map((entry, index) => {
      const kind = input.kinds[index % input.kinds.length];
      const candidates = [
        entry.word.id,
        input.entries[(index + 1) % input.entries.length].word.id,
        input.entries[(index + 2) % input.entries.length].word.id,
      ];
      const answerPosition = index % candidates.length;
      const optionWordIds = [
        ...candidates.slice(answerPosition),
        ...candidates.slice(0, answerPosition),
      ];
      const question = {
        id: `${input.id}-${entry.word.id}`,
        kind,
        correctWordId: entry.word.id,
        optionWordIds,
      };
      if (kind === 'sentence_gap') {
        return {
          ...question,
          kind,
          sentenceBefore: entry.sentence.before,
          sentenceAfter: entry.sentence.after,
          sentenceTranslationUk: entry.sentence.translationUk,
        };
      }
      return { ...question, kind };
    }),
  };
}

export const COMMON_THINGS_SEED: VocabularySeedLesson = {
  id: '91a160f2-8ae8-49dc-b105-3572ca4d7610',
  slug: 'seed-common-things',
  level: 'A1',
  translations: [
    {
      locale: 'en',
      title: 'Common Things (test data)',
      description: 'Learn everyday objects at school and at home.',
    },
    {
      locale: 'uk',
      title: 'Повсякденні речі (тестові дані)',
      description: 'Вивчайте назви звичних речей у школі та вдома.',
    },
  ],
  words: entries.map((entry) => entry.word),
  stages: [
    {
      id: 'learn-first',
      kind: 'learn',
      translations: [
        {
          locale: 'en',
          title: 'Learn 10 words',
          description: 'School things and objects around you',
        },
        {
          locale: 'uk',
          title: 'Вивчіть 10 слів',
          description: 'Шкільні речі та предмети навколо вас',
        },
      ],
      wordIds: firstBlock.map((entry) => entry.word.id),
      exercises: [],
    },
    createPracticeStage({
      id: 'practise-first',
      entries: firstBlock,
      kinds: ['word_to_picture'],
      translations: [
        {
          locale: 'en',
          title: 'Quick practice',
          description: 'Match words and pictures',
        },
        {
          locale: 'uk',
          title: 'Швидка практика',
          description: 'Зіставте слова й картинки',
        },
      ],
    }),
    createPracticeStage({
      id: 'listen-first',
      entries: firstBlock,
      kinds: ['audio_to_picture'],
      translations: [
        {
          locale: 'en',
          title: 'Listening practice',
          description: 'Listen and choose a picture',
        },
        {
          locale: 'uk',
          title: 'Практика на слух',
          description: 'Послухайте й виберіть картинку',
        },
      ],
    }),
    createPracticeStage({
      id: 'sentences-first',
      entries: firstBlock,
      kinds: ['sentence_gap'],
      translations: [
        {
          locale: 'en',
          title: 'Complete the sentence',
          description: 'Choose the missing word',
        },
        {
          locale: 'uk',
          title: 'Доповніть речення',
          description: 'Виберіть пропущене слово',
        },
      ],
    }),
    {
      id: 'learn-second',
      kind: 'learn',
      translations: [
        {
          locale: 'en',
          title: 'Learn 10 more words',
          description: 'Things at home and everyday objects',
        },
        {
          locale: 'uk',
          title: 'Ще 10 слів',
          description: 'Домашні та повсякденні речі',
        },
      ],
      wordIds: secondBlock.map((entry) => entry.word.id),
      exercises: [],
    },
    createPracticeStage({
      id: 'practise-all',
      entries,
      kinds: ['word_to_picture', 'audio_to_picture', 'sentence_gap'],
      translations: [
        {
          locale: 'en',
          title: 'Final challenge',
          description: 'Mixed practice with all 20 words',
        },
        {
          locale: 'uk',
          title: 'Фінальне випробування',
          description: 'Змішані вправи на всі 20 слів',
        },
      ],
    }),
  ],
};
