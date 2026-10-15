export type ArticleSpeechWord = {
  charEnd: number;
  charStart: number;
  text: string;
  tokenKey: string;
};

export type ArticleSpeechChunk = {
  text: string;
  words: ArticleSpeechWord[];
};
