import { COMMON_THINGS_WORD_CARDS } from './wordCards';

const [backpack, book, pencil] = COMMON_THINGS_WORD_CARDS;

// Original local exercises for UI review; checking and progress are not persisted.
export const SENTENCE_PRACTICE_QUESTIONS = [
  {
    id: 'sentence-backpack',
    beforeGap: 'I carry my books to school in a ',
    afterGap: '.',
    translationKey: 'vocabulary.sentences.backpack',
    word: backpack,
    options: [book, backpack, pencil],
  },
  {
    id: 'sentence-book',
    beforeGap: 'I read a ',
    afterGap: ' about animals.',
    translationKey: 'vocabulary.sentences.book',
    word: book,
    options: [book, pencil, backpack],
  },
  {
    id: 'sentence-pencil',
    beforeGap: 'I write with a ',
    afterGap: ' and erase mistakes with an eraser.',
    translationKey: 'vocabulary.sentences.pencil',
    word: pencil,
    options: [backpack, book, pencil],
  },
] as const;
