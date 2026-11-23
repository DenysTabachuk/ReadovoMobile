import type { VocabularySeedContent } from './vocabulary-seed.types';

// Original A1 test content with generated artwork in the development bucket.
const entries = [
  [
    'festival',
    '/ˈfes.tɪ.vəl/',
    'фестиваль',
    'We visit a ___ in Munich.',
    'Ми відвідуємо фестиваль у Мюнхені.',
  ],
  ['tent', '/tent/', 'намет', 'The ___ is big.', 'Намет великий.'],
  [
    'pretzel',
    '/ˈpret.səl/',
    'брецель',
    'I eat a warm ___.',
    'Я їм теплий брецель.',
  ],
  [
    'music',
    '/ˈmjuː.zɪk/',
    'музика',
    'We listen to ___.',
    'Ми слухаємо музику.',
  ],
  [
    'band',
    '/bænd/',
    'музичний гурт',
    'The ___ plays music.',
    'Гурт грає музику.',
  ],
  ['dance', '/dɑːns/', 'танцювати', 'We ___ together.', 'Ми танцюємо разом.'],
  ['food', '/fuːd/', 'їжа', 'The ___ is good.', 'Їжа смачна.'],
  ['drink', '/drɪŋk/', 'напій', 'My ___ is cold.', 'Мій напій холодний.'],
  [
    'table',
    '/ˈteɪ.bəl/',
    'стіл',
    'Our food is on the ___.',
    'Наша їжа на столі.',
  ],
  [
    'bench',
    '/bentʃ/',
    'лава',
    'We sit on a long ___.',
    'Ми сидимо на довгій лаві.',
  ],
  [
    'friend',
    '/frend/',
    'друг',
    'I visit Munich with my ___.',
    'Я відвідую Мюнхен із другом.',
  ],
  [
    'family',
    '/ˈfæm.əl.i/',
    'родина',
    'My ___ visits the festival.',
    'Моя родина відвідує фестиваль.',
  ],
  [
    'ticket',
    '/ˈtɪk.ɪt/',
    'квиток',
    'I have a train ___.',
    'У мене є квиток на потяг.',
  ],
  [
    'train',
    '/treɪn/',
    'потяг',
    'We go to Munich by ___.',
    'Ми їдемо до Мюнхена потягом.',
  ],
  [
    'city',
    '/ˈsɪt.i/',
    'місто',
    'Munich is a ___ in Germany.',
    'Мюнхен — місто в Німеччині.',
  ],
  [
    'flag',
    '/flæɡ/',
    'прапор',
    'The ___ is blue and white.',
    'Прапор синьо-білий.',
  ],
  [
    'hat',
    '/hæt/',
    'капелюх',
    'My friend wears a green ___.',
    'Мій друг носить зелений капелюх.',
  ],
  ['dress', '/dres/', 'сукня', 'Her ___ is blue.', 'Її сукня синя.'],
  ['sausage', '/ˈsɒs.ɪdʒ/', 'ковбаска', 'He eats a ___.', 'Він їсть ковбаску.'],
  ['ride', '/raɪd/', 'атракціон', 'This ___ is fun.', 'Цей атракціон веселий.'],
].map(([id, transcription, translationUk, sentence, sentenceTranslationUk]) => {
  const [sentenceBefore, sentenceAfter] = sentence.split('___');
  return {
    word: {
      id,
      word: id,
      transcription,
      translationUk,
      example: sentence.replace('___', id),
      exampleTranslationUk: sentenceTranslationUk,
      imageKey: `vocabulary/oktoberfest/${id}/v2.webp`,
      imageSourceUrl: 'https://chatgpt.com/',
      imageLicense: 'AI-generated artwork for the Readovo development sample',
      imageAttribution: 'Generated with OpenAI ImageGen',
    },
    sentenceBefore,
    sentenceAfter,
    sentenceTranslationUk,
  };
});

const PRACTICE_KINDS = [
  'word_to_picture',
  'audio_to_picture',
  'sentence_gap',
] as const;
const ANSWER_OPTIONS_COUNT = 3;

export const OKTOBERFEST_VOCABULARY_SEED: VocabularySeedContent = {
  words: entries.map((entry) => entry.word),
  stages: [
    {
      id: 'learn-1',
      kind: 'learn',
      translations: [
        {
          locale: 'en',
          title: 'Festival words',
          description: 'Learn words for your visit.',
        },
        {
          locale: 'uk',
          title: 'Слова фестивалю',
          description: 'Вивчіть слова для вашої подорожі.',
        },
      ],
      wordIds: entries.map((entry) => entry.word.id),
      exercises: [],
    },
    {
      id: 'practise-all',
      kind: 'practice',
      translations: [
        {
          locale: 'en',
          title: 'Festival word test',
          description: 'Practise all 20 words before reading.',
        },
        {
          locale: 'uk',
          title: 'Тест слів фестивалю',
          description: 'Потренуйте всі 20 слів перед читанням.',
        },
      ],
      wordIds: entries.map((entry) => entry.word.id),
      exercises: entries.map((entry, index) => {
        const kind = PRACTICE_KINDS[index % PRACTICE_KINDS.length];
        const candidates = Array.from(
          { length: ANSWER_OPTIONS_COUNT },
          (_, offset) => entries[(index + offset) % entries.length].word.id,
        );
        const rotation = index % ANSWER_OPTIONS_COUNT;
        const question = {
          id: `festival-${entry.word.id}`,
          kind,
          correctWordId: entry.word.id,
          optionWordIds: [
            ...candidates.slice(rotation),
            ...candidates.slice(0, rotation),
          ],
        };
        if (kind === 'sentence_gap') {
          return {
            ...question,
            kind,
            sentenceBefore: entry.sentenceBefore,
            sentenceAfter: entry.sentenceAfter,
            sentenceTranslationUk: entry.sentenceTranslationUk,
          };
        }
        return { ...question, kind };
      }),
    },
  ],
};
