import { type SUPPORTED_TRANSLATION_PAIRS } from './constants';

export type TranslationLanguagePair = {
  sourceLanguage: string;
  targetLanguage: string;
};

type SupportedTranslationPair = (typeof SUPPORTED_TRANSLATION_PAIRS)[number];
export type TranslationSourceLanguage =
  SupportedTranslationPair['sourceLanguage'];
export type TranslationTargetLanguage =
  SupportedTranslationPair['targetLanguage'];

export type { TranslateWordResponseDto as TranslateWordResponse } from './dto/translate-word-response.dto';
