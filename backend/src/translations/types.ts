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

export type GoogleTranslateResponse = {
  data?: {
    translations?: Array<{
      translatedText?: string;
    }>;
  };
};
