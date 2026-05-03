export type DictionaryWordProgress = 'new' | 'in_progress' | 'learned';

export type DictionaryWord = {
  context: string;
  createdAt: string;
  id: string;
  progress: DictionaryWordProgress;
  translation: string;
  word: string;
};

export type CreateDictionaryWordRequest = {
  context: string;
  translation: string;
  word: string;
};
