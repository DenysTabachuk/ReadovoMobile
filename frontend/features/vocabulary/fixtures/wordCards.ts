// Small local sample for visual review; this is not the full ten-word block.
export type VocabularyWordCard = (typeof COMMON_THINGS_WORD_CARDS)[number];

export const COMMON_THINGS_WORD_CARDS = [
  {
    id: 'backpack',
    word: 'Backpack',
    transcription: '/ˈbæk.pæk/',
    translationKey: 'vocabulary.words.backpack.translation',
    example: 'My backpack is red.',
    exampleTranslationKey: 'vocabulary.words.backpack.exampleTranslation',
    image: require('../assets/backpack.svg'),
  },
  {
    id: 'book',
    word: 'Book',
    transcription: '/bʊk/',
    translationKey: 'vocabulary.words.book.translation',
    example: 'This book is about animals.',
    exampleTranslationKey: 'vocabulary.words.book.exampleTranslation',
    image: require('../assets/book.svg'),
  },
  {
    id: 'pencil',
    word: 'Pencil',
    transcription: '/ˈpen.səl/',
    translationKey: 'vocabulary.words.pencil.translation',
    example: 'I write with a pencil.',
    exampleTranslationKey: 'vocabulary.words.pencil.exampleTranslation',
    image: require('../assets/pencil.svg'),
  },
] as const;
