import { type TranslationLanguagePair } from './types';

export const DEFAULT_TRANSLATION_PAIR = {
  sourceLanguage: 'en',
  targetLanguage: 'uk',
} as const satisfies TranslationLanguagePair;
// Directions are allowed as pairs, not as the cross-product of two language lists.
// Include the named default explicitly so adding/reordering pairs cannot change it.
export const SUPPORTED_TRANSLATION_PAIRS = [
  DEFAULT_TRANSLATION_PAIR,
] as const satisfies readonly TranslationLanguagePair[];

export const TRANSLATION_DEFAULT_SOURCE_LANGUAGE =
  DEFAULT_TRANSLATION_PAIR.sourceLanguage;
export const TRANSLATION_DEFAULT_TARGET_LANGUAGE =
  DEFAULT_TRANSLATION_PAIR.targetLanguage;

export const TRANSLATION_SOURCE_LANGUAGES = [
  ...new Set(SUPPORTED_TRANSLATION_PAIRS.map((pair) => pair.sourceLanguage)),
];
export const TRANSLATION_TARGET_LANGUAGES = [
  ...new Set(SUPPORTED_TRANSLATION_PAIRS.map((pair) => pair.targetLanguage)),
];
export const TRANSLATION_WORD_MAX_LENGTH = 200;
export const TRANSLATION_CONTEXT_MAX_LENGTH = 4_000;
