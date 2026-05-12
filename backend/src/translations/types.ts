export type TranslateWordRequest = {
  context?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  word?: string;
};

export type TranslateWordResponse = {
  context?: string;
  contextTranslation?: string;
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
