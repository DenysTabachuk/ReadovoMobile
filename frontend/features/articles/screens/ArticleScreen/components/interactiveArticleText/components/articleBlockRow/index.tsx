import { memo, useCallback } from 'react';
import { type ArticleBlockRowProps } from './types';
import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components/themedText';
import { getHeadingTypographyType } from './utils/getHeadingTypographyType';
import { Ionicons } from '@expo/vector-icons';
import { PlainInlineText } from './components/plainInlineText';
import { TouchableInlineText } from './components/touchableInlineText';
import { normalizeInlineNodesForWordSelection } from './utils/normalizeInlineNodesForWordSelection';
import { TouchableListItem } from './components/touchableListItem';
import { PlainListItem } from './components/plainListItem';
import { ArticleTableBlock } from '../../../articleTableBlock';
import { ArticleFormulaBlock } from '../../../articleFormulaBlock';
import { ArticleImageBlock } from '../../../articleImageBlock';
import { areArticleBlockRowPropsEqual } from './utils/areArticleBlockRowPropsEqual';
import {
  type TableCell,
  type InlineNode,
} from '@/features/articles/api/wikipedia';
import { type InteractiveArticleTextProps } from '../../types';
import { createInlineNodesFromPlainText } from '../../utils/createInlineNodesFromPlainText';
import { TouchableTextParts } from './components/touchableTextParts';
import { splitTextToTouchableParts } from '../../utils/splitTextToTouchableParts';
import { styles } from './styles';

export const ArticleBlockRow = memo(function ArticleBlockRow({
  activeInteractiveBlockKey,
  block,
  blockKey,
  chevronColor,
  collapsed = false,
  onActivateInteractiveBlock,
  onToggleHeading,
  onWordPress,
  selectedTokenKeys,
  speakingTokenKey,
}: ArticleBlockRowProps) {
  const handleToggleHeading = useCallback(() => {
    onToggleHeading(blockKey);
  }, [blockKey, onToggleHeading]);
  const handleActivateInteractiveBlock = useCallback(() => {
    onActivateInteractiveBlock(blockKey);
  }, [blockKey, onActivateInteractiveBlock]);
  const isInteractiveBlock = activeInteractiveBlockKey === blockKey;

  if (block.type === 'heading') {
    return (
      <Pressable
        onPress={handleToggleHeading}
        style={styles.collapsibleHeading}
      >
        <ThemedText
          style={[
            styles.heading,
            block.level === 1 ? styles.headingLevel1 : null,
            block.level === 2 ? styles.headingLevel2 : null,
            block.level === 3 ? styles.headingLevel3 : null,
          ]}
          type={getHeadingTypographyType(block.level)}
        >
          {block.text}
        </ThemedText>
        <Ionicons
          color={chevronColor}
          name="chevron-down"
          size={18}
          style={collapsed ? null : styles.collapsibleArrowExpanded}
        />
      </Pressable>
    );
  }

  if (block.type === 'paragraph') {
    if (!isInteractiveBlock) {
      return (
        <PlainInlineText
          nodes={block.children}
          onPress={handleActivateInteractiveBlock}
          prefix={blockKey}
          speakingTokenKey={speakingTokenKey}
          style={styles.paragraph}
        />
      );
    }

    return (
      <View style={styles.wordPickBlock}>
        <Ionicons
          color="rgba(111, 63, 240, 0.5)"
          name="language-outline"
          size={16}
          style={styles.wordPickHint}
        />
        <TouchableInlineText
          nodes={normalizeInlineNodesForWordSelection(block.children)}
          onWordPress={onWordPress}
          prefix={blockKey}
          selectedTokenKeys={selectedTokenKeys}
          speakingTokenKey={speakingTokenKey}
          style={styles.paragraph}
        />
      </View>
    );
  }

  if (block.type === 'list') {
    return (
      <View
        style={[styles.list, isInteractiveBlock ? styles.wordPickBlock : null]}
      >
        {block.items.map((item, itemIndex) =>
          isInteractiveBlock ? (
            <TouchableListItem
              item={normalizeInlineNodesForWordSelection(item)}
              itemIndex={itemIndex}
              key={`${blockKey}-item-${itemIndex}`}
              onWordPress={onWordPress}
              ordered={block.ordered}
              prefix={`${blockKey}-item-${itemIndex}`}
              selectedTokenKeys={selectedTokenKeys}
              speakingTokenKey={speakingTokenKey}
            />
          ) : (
            <PlainListItem
              item={item}
              itemIndex={itemIndex}
              key={`${blockKey}-item-${itemIndex}`}
              onPress={handleActivateInteractiveBlock}
              ordered={block.ordered}
              prefix={`${blockKey}-item-${itemIndex}`}
              speakingTokenKey={speakingTokenKey}
            />
          ),
        )}
        {isInteractiveBlock ? (
          <Ionicons
            color="rgba(111, 63, 240, 0.5)"
            name="language-outline"
            size={16}
            style={styles.wordPickHint}
          />
        ) : null}
      </View>
    );
  }

  if (block.type === 'table') {
    return (
      <ArticleTableBlock
        renderCellContent={({
          cell,
          prefix,
          selectedTokenKey: currentSelectedTokenKey,
        }) =>
          renderTableCellText({
            cell,
            onWordPress,
            prefix,
            selectedTokenKey: currentSelectedTokenKey,
            speakingTokenKey,
          })
        }
        rows={block.rows}
        selectedTokenKey={selectedTokenKeys?.[0]}
      />
    );
  }

  if (block.type === 'formula') {
    return (
      <ArticleFormulaBlock
        altText={block.altText}
        heightEx={block.heightEx}
        svg={block.svg}
        widthEx={block.widthEx}
      />
    );
  }

  if (block.type !== 'image') {
    return null;
  }

  return (
    <ArticleImageBlock
      alt={block.alt}
      caption={block.caption}
      src={block.src}
    />
  );
}, areArticleBlockRowPropsEqual);

function renderTableCellText(params: {
  cell: TableCell;
  onWordPress: InteractiveArticleTextProps['onWordPress'];
  prefix: string;
  selectedTokenKey?: string;
  speakingTokenKey?: string;
}) {
  return renderTouchableParts({
    nodes: createInlineNodesFromPlainText(params.cell.text),
    onWordPress: params.onWordPress,
    prefix: params.prefix,
    selectedTokenKey: params.selectedTokenKey,
    speakingTokenKey: params.speakingTokenKey,
  });
}

function renderTouchableParts(params: {
  nodes: InlineNode[];
  onWordPress: InteractiveArticleTextProps['onWordPress'];
  prefix: string;
  selectedTokenKey?: string;
  speakingTokenKey?: string;
}) {
  return (
    <TouchableTextParts
      onWordPress={params.onWordPress}
      parts={splitTextToTouchableParts(params.nodes, params.prefix)}
      selectedTokenKey={params.selectedTokenKey}
      speakingTokenKey={params.speakingTokenKey}
    />
  );
}
