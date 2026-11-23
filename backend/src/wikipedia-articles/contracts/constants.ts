export const ARTICLE_CATEGORIES = [
  'all',
  'biography',
  'culture',
  'food',
  'geography',
  'history',
  'nature',
  'science',
  'space',
  'sports',
  'technology',
] as const;
export const SIMPLIFICATION_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
export const TRANSFORMATION_TYPES = ['adaptation', 'summary'] as const;
export const ARTICLE_PREVIEW_LENGTHS = [
  'all',
  'short',
  'medium',
  'long',
] as const;
export const ARTICLE_SORT_OPTIONS = [
  'default',
  'length_desc',
  'length_asc',
] as const;
export const ARTICLE_READY_LEVELS = ['all', 'A1', 'A2', 'B1', 'B2'] as const;
export const ARTICLE_READY_TRANSFORMATIONS = [
  'all',
  'adaptation',
  'summary',
  'both',
] as const;
export const ARTICLE_TARGET_LENGTHS = ['short', 'medium', 'long'] as const;
export const ARTICLE_QUESTION_TYPES = [
  'single_choice',
  'multiple_choice',
  'true_false',
] as const;
export const VOCABULARY_QUESTION_FORMATS = [
  'translation',
  'reverse_translation',
  'definition',
  'cloze',
  'synonym',
] as const;
export const VOCABULARY_TERM_KINDS = ['word', 'phrase'] as const;

export const ARTICLE_TEXT_MAX_LENGTH = 2_000_000;
export const ARTICLE_TITLE_MAX_LENGTH = 500;

export const ARTICLE_EXCLUSION_IDS_MAX_COUNT = 50;
export const ARTICLE_ADAPTATION_IDS_MAX_COUNT = 100;
