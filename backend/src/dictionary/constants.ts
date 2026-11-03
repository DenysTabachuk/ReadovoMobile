export const MAX_DICTIONARY_FRAGMENT_WORDS = 5;
export const DEFAULT_DICTIONARY_TEST_LIMIT = 10;

export const MAX_DICTIONARY_WORD_LIST_SIZE = 1000;
export const NON_BLANK_DICTIONARY_TEXT_PATTERN = /\S/;

export const DICTIONARY_WORD_PROGRESS = [
  'new',
  'in_progress',
  'learned',
] as const;
export const DICTIONARY_TEST_QUESTION_FORMATS = [
  'translation',
  'reverse_translation',
  'cloze',
] as const;

export const DICTIONARY_WORD_MAX_LENGTH = 200;
