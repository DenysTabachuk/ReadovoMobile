import { Fragment, useMemo } from 'react';
import { View } from 'react-native';

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

type ArticleBlock =
  | {
      key: string;
      level: number;
      text: string;
      type: 'heading';
    }
  | {
      items: ArticleListItem[];
      key: string;
      type: 'list';
    }
  | {
      key: string;
      tokens: ArticleToken[];
      type: 'paragraph';
    };

type ArticleListItem = {
  key: string;
  marker: string;
  tokens: ArticleToken[];
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
const SECTION_HEADING_PATTERN = /^(={2,})\s*(.*?)\s*\1$/;
const LIST_ITEM_PATTERN = /^([*#-]+|[•●▪◦]+|[A-Za-z0-9]+[.)])\s*(.*)$/;
const IGNORED_SECTION_TITLES = new Set([
  'bibliography',
  'external links',
  'further reading',
  'gallery',
  'notes',
  'references',
  'see also',
  'sources',
]);

export function InteractiveArticleText({
  onWordPress,
  selectedTokenKey,
  text,
}: InteractiveArticleTextProps) {
  const blocks = useMemo(() => parseArticleBlocks(text), [text]);

  return (
    <View style={styles.container}>
      {blocks.map((block) => {
        if (block.type === 'heading') {
          return (
            <ThemedText
              key={block.key}
              style={[
                styles.heading,
                block.level >= 3 ? styles.subheading : null,
              ]}
              type={block.level >= 3 ? 'bodyStrong' : 'sectionTitle'}>
              {block.text}
            </ThemedText>
          );
        }

        if (block.type === 'list') {
          return (
            <View key={block.key} style={styles.list}>
              {block.items.map((item) => (
                <View key={item.key} style={styles.listItem}>
                  <ThemedText style={styles.listBullet} type="paragraph">
                    {getListMarkerLabel(item.marker)}
                  </ThemedText>
                  <ThemedText style={styles.listItemText} type="paragraph">
                    {renderTokens(item.tokens, onWordPress, selectedTokenKey)}
                  </ThemedText>
                </View>
              ))}
            </View>
          );
        }

        return (
          <ThemedText key={block.key} type="paragraph" style={styles.paragraph}>
            {renderTokens(block.tokens, onWordPress, selectedTokenKey)}
          </ThemedText>
        );
      })}
    </View>
  );
}

function parseArticleBlocks(text: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  const lines = text.split(/\r?\n/);
  let paragraphLines: string[] = [];
  let listItems: ArticleListItem[] = [];
  let shouldSkipSection = false;

  const flushParagraph = () => {
    const paragraphText = paragraphLines.join(' ').trim();

    if (!paragraphText) {
      paragraphLines = [];
      return;
    }

    blocks.push({
      key: `paragraph-${blocks.length}`,
      tokens: tokenizeArticleText(paragraphText),
      type: 'paragraph',
    });
    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }

    blocks.push({
      items: listItems,
      key: `list-${blocks.length}`,
      type: 'list',
    });
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = line.match(SECTION_HEADING_PATTERN);

    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1]?.length ?? 2;
      const headingText = headingMatch[2]?.trim() ?? line;
      const normalizedHeading = normalizeSectionTitle(headingText);

      shouldSkipSection = IGNORED_SECTION_TITLES.has(normalizedHeading);

      if (!shouldSkipSection) {
        blocks.push({
          key: `heading-${blocks.length}`,
          level,
          text: headingText,
          type: 'heading',
        });
      }

      continue;
    }

    if (shouldSkipSection) {
      continue;
    }

    const listItemMatch = line.match(LIST_ITEM_PATTERN);

    if (listItemMatch) {
      flushParagraph();
      const marker = listItemMatch[1] ?? '-';
      const itemText = listItemMatch[2]?.trim() ?? '';

      if (itemText) {
        listItems.push({
          key: `list-item-${blocks.length}-${listItems.length}`,
          marker,
          tokens: tokenizeArticleText(itemText),
        });
      }

      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return removeEmptyHeadings(blocks);
}

function renderTokens(
  tokens: ArticleToken[],
  onWordPress: InteractiveArticleTextProps['onWordPress'],
  selectedTokenKey?: string,
) {
  return tokens.map((token) => {
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
  });
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

function normalizeSectionTitle(title: string): string {
  return title.replace(/\s+/g, ' ').trim().toLowerCase();
}

function removeEmptyHeadings(blocks: ArticleBlock[]): ArticleBlock[] {
  return blocks.filter((block, index) => {
    if (block.type !== 'heading') {
      return true;
    }

    return hasContentInSection(blocks, index);
  });
}

function hasContentInSection(blocks: ArticleBlock[], headingIndex: number): boolean {
  const heading = blocks[headingIndex];

  if (!heading || heading.type !== 'heading') {
    return false;
  }

  for (let index = headingIndex + 1; index < blocks.length; index += 1) {
    const nextBlock = blocks[index];

    if (nextBlock.type === 'paragraph' || nextBlock.type === 'list') {
      return true;
    }

    if (nextBlock.level <= heading.level) {
      return false;
    }
  }

  return false;
}

function getListMarkerLabel(marker: string): string {
  if (marker.startsWith('#')) {
    return `${marker.length}.`;
  }

  return '\u2022';
}
