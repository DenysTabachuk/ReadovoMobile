import { useMemo } from 'react';
import { View } from 'react-native';

import {
  type ArticleBlock,
  type InlineNode,
  type TableCell,
} from '@/api/wikipedia';
import { ThemedText } from '@/components/themedText';

import { ArticleImageBlock } from '../articleImageBlock';
import { ArticleTableBlock } from '../articleTableBlock';
import { TouchableWord } from '../touchableWord';
import { styles } from './styles';

type InteractiveArticleTextProps = {
  blocks?: ArticleBlock[];
  onWordPress: (selection: {
    context: string;
    tokenKey: string;
    word: string;
  }) => void;
  selectedTokenKey?: string;
  text?: string;
};

type SentenceRange = {
  end: number;
  text: string;
};

type TouchableTextPart =
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
      text: string;
      type: 'word';
      word: string;
    };

const LIST_ITEM_PATTERN = /^([*#-]+|[\u2022\u25cf\u25aa\u25e6]+|[A-Za-z0-9]+[.)])\s*(.*)$/;
const SECTION_HEADING_PATTERN = /^(={2,})\s*(.*?)\s*\1$/;
const SENTENCE_PATTERN = /[^.!?\n]+(?:[.!?]+(?=\s|$)|$)|\n+/g;

export function InteractiveArticleText({
  blocks,
  onWordPress,
  selectedTokenKey,
  text,
}: InteractiveArticleTextProps) {
  const resolvedBlocks = useMemo(() => {
    if (blocks && blocks.length > 0) {
      return blocks;
    }

    return parsePlainTextToBlocks(text ?? '');
  }, [blocks, text]);

  return (
    <View style={styles.container}>
      {resolvedBlocks.map((block, index) => {
        const blockKey = `block-${index}`;

        if (block.type === 'heading') {
          return (
            <ThemedText
              key={blockKey}
              style={[
                styles.heading,
                block.level === 1 ? styles.headingLevel1 : null,
                block.level === 2 ? styles.headingLevel2 : null,
                block.level === 3 ? styles.headingLevel3 : null,
              ]}
              type={getHeadingTypographyType(block.level)}>
              {block.text}
            </ThemedText>
          );
        }

        if (block.type === 'paragraph') {
          return (
            <ThemedText key={blockKey} style={styles.paragraph} type="paragraph">
              {renderTouchableParts({
                nodes: block.children,
                onWordPress,
                prefix: blockKey,
                selectedTokenKey,
              })}
            </ThemedText>
          );
        }

        if (block.type === 'list') {
          return (
            <View key={blockKey} style={styles.list}>
              {block.items.map((item, itemIndex) => (
                <View key={`${blockKey}-item-${itemIndex}`} style={styles.listItem}>
                  <ThemedText style={styles.listBullet} type="paragraph">
                    {block.ordered ? `${itemIndex + 1}.` : '\u2022'}
                  </ThemedText>
                  <ThemedText style={styles.listItemText} type="paragraph">
                    {renderTouchableParts({
                      nodes: item,
                      onWordPress,
                      prefix: `${blockKey}-item-${itemIndex}`,
                      selectedTokenKey,
                    })}
                  </ThemedText>
                </View>
              ))}
            </View>
          );
        }

        if (block.type === 'table') {
          return (
            <ArticleTableBlock
              key={blockKey}
              renderCellContent={({ cell, prefix, selectedTokenKey: currentSelectedTokenKey }) =>
                renderTableCellText({
                  cell,
                  onWordPress,
                  prefix,
                  selectedTokenKey: currentSelectedTokenKey,
                })
              }
              rows={block.rows}
              selectedTokenKey={selectedTokenKey}
            />
          );
        }

        return (
          <ArticleImageBlock
            alt={block.alt}
            caption={block.caption}
            key={blockKey}
            src={block.src}
          />
        );
      })}
    </View>
  );
}

export function splitTextToTouchableParts(
  nodes: InlineNode[],
  prefix: string,
): TouchableTextPart[] {
  const text = nodes.map((node) => node.text).join('');
  const sentenceRanges = getSentenceRanges(text);
  const parts: TouchableTextPart[] = [];
  let cursor = 0;

  nodes.forEach((node, index) => {
    const start = cursor;
    const end = start + node.text.length;

    if (node.type === 'word') {
      parts.push({
        bold: node.bold,
        contextSentence: getSentenceForRange(sentenceRanges, start, end),
        italic: node.italic,
        key: `${prefix}-word-${index}-${start}`,
        text: node.text,
        type: 'word',
        word: normalizeWord(node.text),
      });
    } else {
      parts.push({
        bold: node.bold,
        italic: node.italic,
        key: `${prefix}-text-${index}-${start}`,
        text: node.text,
        type: 'text',
      });
    }

    cursor = end;
  });

  return parts;
}

function renderTouchableParts(params: {
  nodes: InlineNode[];
  onWordPress: InteractiveArticleTextProps['onWordPress'];
  prefix: string;
  selectedTokenKey?: string;
}) {
  return splitTextToTouchableParts(params.nodes, params.prefix).map((part) => {
    if (part.type === 'text') {
      return (
        <ThemedText
          key={part.key}
          style={[
            part.bold ? styles.inlineBold : null,
            part.italic ? styles.inlineItalic : null,
          ]}
          type="paragraph">
          {part.text}
        </ThemedText>
      );
    }

    return (
      <TouchableWord
        key={part.key}
        bold={part.bold}
        contextSentence={part.contextSentence}
        italic={part.italic}
        onPress={params.onWordPress}
        selected={params.selectedTokenKey === part.key}
        text={part.text}
        tokenKey={part.key}
        word={part.word}
      />
    );
  });
}

function renderTableCellText(params: {
  cell: TableCell;
  onWordPress: InteractiveArticleTextProps['onWordPress'];
  prefix: string;
  selectedTokenKey?: string;
}) {
  return renderTouchableParts({
    nodes: createInlineNodesFromPlainText(params.cell.text),
    onWordPress: params.onWordPress,
    prefix: params.prefix,
    selectedTokenKey: params.selectedTokenKey,
  });
}

function parsePlainTextToBlocks(text: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  const lines = text.split(/\r?\n/);
  let paragraphLines: string[] = [];
  let listItems: InlineNode[][] = [];
  let listOrdered = false;

  const flushParagraph = () => {
    const paragraphText = paragraphLines.join(' ').trim();

    if (!paragraphText) {
      paragraphLines = [];
      return;
    }

    blocks.push({
      children: createInlineNodesFromPlainText(paragraphText),
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
      ordered: listOrdered,
      type: 'list',
    });
    listItems = [];
    listOrdered = false;
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
      const headingLevel = Math.min((headingMatch[1]?.length ?? 2) - 1, 3) as
        | 1
        | 2
        | 3;
      const headingText = headingMatch[2]?.trim() ?? line;

      if (headingText) {
        blocks.push({
          level: headingLevel,
          text: headingText,
          type: 'heading',
        });
      }

      continue;
    }

    const listItemMatch = line.match(LIST_ITEM_PATTERN);

    if (listItemMatch) {
      flushParagraph();
      const marker = listItemMatch[1] ?? '-';
      const itemText = listItemMatch[2]?.trim() ?? '';

      if (itemText) {
        listOrdered = marker.startsWith('#') || /^\d+[.)]$/.test(marker);
        listItems.push(createInlineNodesFromPlainText(itemText));
      }

      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

function createInlineNodesFromPlainText(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(/[A-Za-z]+(?:['\u2019-][A-Za-z]+)*/g)) {
    const matchedWord = match[0];
    const start = match.index ?? 0;

    if (cursor < start) {
      nodes.push({
        text: text.slice(cursor, start),
        type: 'text',
      });
    }

    nodes.push({
      text: matchedWord,
      type: 'word',
    });
    cursor = start + matchedWord.length;
  }

  if (cursor < text.length) {
    nodes.push({
      text: text.slice(cursor),
      type: 'text',
    });
  }

  return nodes;
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

function getHeadingTypographyType(level: 1 | 2 | 3) {
  if (level === 1) {
    return 'screenTitle' as const;
  }

  if (level === 2) {
    return 'sectionTitle' as const;
  }

  return 'bodyStrong' as const;
}
