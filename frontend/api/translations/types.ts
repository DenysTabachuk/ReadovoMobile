export type TranslateWordRequest = {
  context?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  word: string;
};

export type TranslateWordResponse = {
  context?: string;
  sourceLanguage: string;
  targetLanguage: string;
  translation: string;
  word: string;
};
