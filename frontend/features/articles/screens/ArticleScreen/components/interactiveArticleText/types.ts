export type TouchableTextPart =
  | {
      bold?: boolean;
      italic?: boolean;
      key: string;
      text: string;
      type: 'text';
    }
  | {
      bold?: boolean;
      contextSentence?: string;
      italic?: boolean;
      key: string;
      sentenceKey?: string;
      sentenceWordIndex?: number;
      text: string;
      type: 'word';
      word: string;
    };
