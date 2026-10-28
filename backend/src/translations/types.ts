export type TranslateWordResponse = {
  baseTranslation: string;
  context?: string;
  contextTranslation?: string;
  contextualTranslation?: string;
  sourceLanguage: string;
  targetLanguage: string;
  translation: string;
  word: string;
};
