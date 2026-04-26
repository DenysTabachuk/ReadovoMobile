import { Fragment, useMemo } from 'react';

import { ThemedText } from '@/components/themedText';

import { styles } from './styles';

type InteractiveArticleTextProps = {
  onWordPress: (selection: {
    context: string;
    tokenKey: string;
    word: string;
  }) => void;
  selectedTokenKey?: string;
  text: string;
};

type SentenceRange = {
  end: number;
  text: string;
};

type ArticleToken =
  | {
      key: string;
      text: string;
      type: 'separator';
    }
  | {
      context: string;
      key: string;
      text: string;
      type: 'word';
      word: string;
    };

const WORD_PATTERN = /[A-Za-z]+(?:['\u2019-][A-Za-z]+)*/g;
const SENTENCE_PATTERN = /[^.!?\n]+(?:[.!?]+(?=\s|$)|$)|\n+/g;

export function InteractiveArticleText({
  onWordPress,
  selectedTokenKey,
  text,
}: InteractiveArticleTextProps) {
  const tokens = useMemo(() => tokenizeArticleText(text), [text]);

  return (
    <ThemedText type="paragraph">
      {tokens.map((token) => {
        if (token.type === 'separator') {
          return <Fragment key={token.key}>{token.text}</Fragment>;
        }

        return (
          <ThemedText
            key={token.key}
            onPress={() =>
              onWordPress({
                context: token.context,
                tokenKey: token.key,
                word: token.word,
              })
            }
            style={[
              styles.tappableWord,
              selectedTokenKey === token.key ? styles.selectedWord : null,
              selectedTokenKey === token.key ? styles.selectedWordText : null,
            ]}>
            {token.text}
          </ThemedText>
        );
      })}
    </ThemedText>
  );
}

function tokenizeArticleText(text: string): ArticleToken[] {
  const sentenceRanges = getSentenceRanges(text);
  const tokens: ArticleToken[] = [];
  let cursor = 0;
  let tokenIndex = 0;

  for (const match of text.matchAll(WORD_PATTERN)) {
    const word = match[0];
    const start = match.index ?? 0;
    const end = start + word.length;

    if (cursor < start) {
      tokens.push({
        key: `separator-${tokenIndex}`,
        text: text.slice(cursor, start),
        type: 'separator',
      });
      tokenIndex += 1;
    }

    tokens.push({
      context: getSentenceForRange(sentenceRanges, start, end),
      key: `word-${tokenIndex}`,
      text: word,
      type: 'word',
      word: normalizeWord(word),
    });
    tokenIndex += 1;
    cursor = end;
  }

  if (cursor < text.length) {
    tokens.push({
      key: `separator-${tokenIndex}`,
      text: text.slice(cursor),
      type: 'separator',
    });
  }

  return tokens;
}

function getSentenceRanges(text: string): SentenceRange[] {
  return Array.from(text.matchAll(SENTENCE_PATTERN))
    .map((match) => {
      const sentenceText = match[0].trim();

      if (!sentenceText || sentenceText === '\n') {
        return null;
      }

      return {
        end: (match.index ?? 0) + match[0].length,
        text: sentenceText,
      };
    })
    .filter((range): range is SentenceRange => range !== null);
}

function getSentenceForRange(
  sentenceRanges: SentenceRange[],
  start: number,
  end: number,
): string {
  const sentence = sentenceRanges.find(
    (range) => start < range.end && end <= range.end,
  );

  return sentence?.text ?? '';
}

function normalizeWord(word: string): string {
  return word.replaceAll('\u2019', "'").toLowerCase();
}
