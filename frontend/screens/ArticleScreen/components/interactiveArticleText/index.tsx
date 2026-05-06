import { Ionicons } from '@expo/vector-icons';
import {
  memo,
  useCallback,
  useMemo,
  useState,
  type ReactElement,
} from 'react';
import {
  FlatList,
  Pressable,
  View,
  type ListRenderItem,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import {
  type ArticleBlock,
  type InlineNode,
  type TableCell,
} from '@/api/wikipedia';
import { ThemedText } from '@/components/themedText';
import { useThemeColor } from '@/hooks/use-theme-color';

import { ArticleFormulaBlock } from '../articleFormulaBlock';
import { ArticleImageBlock } from '../articleImageBlock';
import { ArticleTableBlock } from '../articleTableBlock';
import { TouchableWord } from '../touchableWord';
import { styles } from './styles';

type InteractiveArticleTextProps = {
  blocks?: ArticleBlock[];
  contentContainerStyle?: StyleProp<ViewStyle>;
  ListHeaderComponent?: ReactElement | null;
  onWordPress: (selection: {
    context: string;
    tokenKey: string;
    word: string;
  }) => void;
  selectedTokenKey?: string;
  text?: string;
};

type ArticleBlockListItem = {
  block: ArticleBlock;
  key: string;
  sourceIndex: number;
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

type TouchableInlineTextProps = {
  nodes: InlineNode[];
  onWordPress: InteractiveArticleTextProps['onWordPress'];
  prefix: string;
  selectedTokenKey?: string;
  style: StyleProp<TextStyle>;
};

type TouchableListItemProps = {
  item: InlineNode[];
  itemIndex: number;
  onWordPress: InteractiveArticleTextProps['onWordPress'];
  ordered: boolean;
  prefix: string;
  selectedTokenKey?: string;
};

const LIST_ITEM_PATTERN = /^([*#-]+|[\u2022\u25cf\u25aa\u25e6]+|[A-Za-z0-9]+[.)])\s*(.*)$/;
const SECTION_HEADING_PATTERN = /^(={2,})\s*(.*?)\s*\1$/;
const SENTENCE_PATTERN = /[^.!?\n]+(?:[.!?]+(?=\s|$)|$)|\n+/g;

// FlatList virtualization tuning for large articles:
// - INITIAL_RENDER_BLOCK_COUNT: blocks rendered immediately when the screen opens.
// - MAX_RENDER_BATCH_SIZE: max blocks added in one background render batch.
// - RENDER_BATCH_INTERVAL_MS: delay between render batches; higher values reduce JS pressure.
// - VIRTUALIZED_WINDOW_SIZE: number of viewport-heights kept mounted around the visible area.
const INITIAL_RENDER_BLOCK_COUNT = 10;
const MAX_RENDER_BATCH_SIZE = 10;
const RENDER_BATCH_INTERVAL_MS = 50;
const VIRTUALIZED_WINDOW_SIZE = 9;



export function InteractiveArticleText({
  blocks,
  contentContainerStyle,
  ListHeaderComponent,
  onWordPress,
  selectedTokenKey,
  text,
}: InteractiveArticleTextProps) {
  const [collapsedHeadings, setCollapsedHeadings] = useState<Record<string, boolean>>({});
  const chevronColor = useThemeColor({ dark: '#9ba1a6', light: '#687076' }, 'icon');
  const resolvedBlocks = useMemo(() => {
    if (blocks && blocks.length > 0) {
      return blocks;
    }

    return parsePlainTextToBlocks(text ?? '');
  }, [blocks, text]);
  const visibleBlockItems = useMemo(() => {
    const activeCollapsedLevels: number[] = [];
    const items: ArticleBlockListItem[] = [];

    resolvedBlocks.forEach((block, index) => {
      if (block.type === 'heading') {
        for (
          let levelIndex = activeCollapsedLevels.length - 1;
          levelIndex >= 0;
          levelIndex -= 1
        ) {
          if (activeCollapsedLevels[levelIndex] >= block.level) {
            activeCollapsedLevels.splice(levelIndex, 1);
          }
        }

        const isHiddenByAncestor = activeCollapsedLevels.length > 0;
        const headingKey = createHeadingKey(block, index);
        const isCollapsed = Boolean(collapsedHeadings[headingKey]);

        if (isCollapsed) {
          activeCollapsedLevels.push(block.level);
        }

        if (!isHiddenByAncestor) {
          items.push({
            block,
            key: headingKey,
            sourceIndex: index,
          });
        }

        return;
      }

      if (activeCollapsedLevels.length > 0) {
        return;
      }

      items.push({
        block,
        key: `block-${index}`,
        sourceIndex: index,
      });
    });

    return items;
  }, [collapsedHeadings, resolvedBlocks]);

  const renderBlock = useCallback((block: ArticleBlock, blockKey: string) => {
    if (block.type === 'paragraph') {
      return (
        <TouchableInlineText
          key={blockKey}
          nodes={block.children}
          onWordPress={onWordPress}
          prefix={blockKey}
          selectedTokenKey={selectedTokenKey}
          style={styles.paragraph}
        />
      );
    }

    if (block.type === 'list') {
      return (
        <View key={blockKey} style={styles.list}>
          {block.items.map((item, itemIndex) => (
            <TouchableListItem
              item={item}
              itemIndex={itemIndex}
              key={`${blockKey}-item-${itemIndex}`}
              onWordPress={onWordPress}
              ordered={block.ordered}
              prefix={`${blockKey}-item-${itemIndex}`}
              selectedTokenKey={selectedTokenKey}
            />
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

    if (block.type === 'formula') {
      return (
        <ArticleFormulaBlock
          altText={block.altText}
          heightEx={block.heightEx}
          key={blockKey}
          svg={block.svg}
          widthEx={block.widthEx}
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
  }, [onWordPress, selectedTokenKey]);
  const renderItem = useCallback<ListRenderItem<ArticleBlockListItem>>(
    ({ item }) => {
      const { block } = item;

      if (block.type === 'heading') {
        const isCollapsed = Boolean(collapsedHeadings[item.key]);

        return (
          <Pressable
            onPress={() =>
              setCollapsedHeadings((current) => ({
                ...current,
                [item.key]: !current[item.key],
              }))
            }
            style={styles.collapsibleHeading}>
            <ThemedText
              style={[
                styles.heading,
                block.level === 1 ? styles.headingLevel1 : null,
                block.level === 2 ? styles.headingLevel2 : null,
                block.level === 3 ? styles.headingLevel3 : null,
              ]}
              type={getHeadingTypographyType(block.level)}>
              {block.text}
            </ThemedText>
            <Ionicons
              color={chevronColor}
              name="chevron-down"
              size={18}
              style={isCollapsed ? null : styles.collapsibleArrowExpanded}
            />
          </Pressable>
        );
      }

      return renderBlock(block, item.key);
    },
    [chevronColor, collapsedHeadings, renderBlock],
  );

  return (
    <FlatList
      data={visibleBlockItems}
      initialNumToRender={INITIAL_RENDER_BLOCK_COUNT}
      keyExtractor={(item) => item.key}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={ListHeaderComponent}
      maxToRenderPerBatch={MAX_RENDER_BATCH_SIZE}
      renderItem={renderItem}
      removeClippedSubviews={false}
      showsVerticalScrollIndicator={false}
      style={styles.container}
      updateCellsBatchingPeriod={RENDER_BATCH_INTERVAL_MS}
      windowSize={VIRTUALIZED_WINDOW_SIZE}
      contentContainerStyle={contentContainerStyle}
    />
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
  return renderTouchablePartsFromParts({
    onWordPress: params.onWordPress,
    parts: splitTextToTouchableParts(params.nodes, params.prefix),
    selectedTokenKey: params.selectedTokenKey,
  });
}

function renderTouchablePartsFromParts(params: {
  onWordPress: InteractiveArticleTextProps['onWordPress'];
  parts: TouchableTextPart[];
  selectedTokenKey?: string;
}) {
  return params.parts.map((part) => {
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

const TouchableInlineText = memo(function TouchableInlineText({
  nodes,
  onWordPress,
  prefix,
  selectedTokenKey,
  style,
}: TouchableInlineTextProps) {
  const parts = useMemo(
    () => splitTextToTouchableParts(nodes, prefix),
    [nodes, prefix],
  );

  return (
    <ThemedText style={style} type="paragraph">
      {renderTouchablePartsFromParts({
        onWordPress,
        parts,
        selectedTokenKey,
      })}
    </ThemedText>
  );
}, areTouchableInlineTextPropsEqual);

const TouchableListItem = memo(function TouchableListItem({
  item,
  itemIndex,
  onWordPress,
  ordered,
  prefix,
  selectedTokenKey,
}: TouchableListItemProps) {
  return (
    <View style={styles.listItem}>
      <ThemedText style={styles.listBullet} type="paragraph">
        {ordered ? `${itemIndex + 1}.` : '\u2022'}
      </ThemedText>
      <TouchableInlineText
        nodes={item}
        onWordPress={onWordPress}
        prefix={prefix}
        selectedTokenKey={selectedTokenKey}
        style={styles.listItemText}
      />
    </View>
  );
}, areTouchableListItemPropsEqual);

function areTouchableInlineTextPropsEqual(
  previousProps: TouchableInlineTextProps,
  nextProps: TouchableInlineTextProps,
): boolean {
  return (
    previousProps.nodes === nextProps.nodes &&
    previousProps.onWordPress === nextProps.onWordPress &&
    previousProps.prefix === nextProps.prefix &&
    previousProps.style === nextProps.style &&
    isSelectedTokenChangeIrrelevant({
      nextSelectedTokenKey: nextProps.selectedTokenKey,
      previousSelectedTokenKey: previousProps.selectedTokenKey,
      prefix: nextProps.prefix,
    })
  );
}

function areTouchableListItemPropsEqual(
  previousProps: TouchableListItemProps,
  nextProps: TouchableListItemProps,
): boolean {
  return (
    previousProps.item === nextProps.item &&
    previousProps.itemIndex === nextProps.itemIndex &&
    previousProps.onWordPress === nextProps.onWordPress &&
    previousProps.ordered === nextProps.ordered &&
    previousProps.prefix === nextProps.prefix &&
    isSelectedTokenChangeIrrelevant({
      nextSelectedTokenKey: nextProps.selectedTokenKey,
      previousSelectedTokenKey: previousProps.selectedTokenKey,
      prefix: nextProps.prefix,
    })
  );
}

function isSelectedTokenChangeIrrelevant(params: {
  nextSelectedTokenKey?: string;
  prefix: string;
  previousSelectedTokenKey?: string;
}): boolean {
  const previousSelectionIsHere = isTokenKeyInsidePrefix(
    params.previousSelectedTokenKey,
    params.prefix,
  );
  const nextSelectionIsHere = isTokenKeyInsidePrefix(
    params.nextSelectedTokenKey,
    params.prefix,
  );

  if (!previousSelectionIsHere && !nextSelectionIsHere) {
    return true;
  }

  return params.previousSelectedTokenKey === params.nextSelectedTokenKey;
}

function isTokenKeyInsidePrefix(
  tokenKey: string | undefined,
  prefix: string,
): boolean {
  return tokenKey?.startsWith(`${prefix}-word-`) ?? false;
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

function createHeadingKey(
  block: Extract<ArticleBlock, { type: 'heading' }>,
  index: number,
): string {
  return `heading-${index}-${block.text}`;
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
