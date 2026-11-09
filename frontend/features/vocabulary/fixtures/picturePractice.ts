import { COMMON_THINGS_WORD_CARDS } from './wordCards';

const [backpack, book, pencil] = COMMON_THINGS_WORD_CARDS;

// Local UI sample only; production attempts will use server-side answer checking.
export const PICTURE_PRACTICE_QUESTIONS = [
  { id: 'picture-backpack', word: backpack, options: [book, pencil, backpack] },
  { id: 'picture-book', word: book, options: [pencil, book, backpack] },
  { id: 'picture-pencil', word: pencil, options: [pencil, backpack, book] },
] as const;
