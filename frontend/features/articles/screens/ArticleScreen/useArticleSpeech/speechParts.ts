import * as Speech from 'expo-speech';

import { type ArticleBlock, type InlineNode } from '@/api/wikipedia';

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

const WORD_PATTERN = /[A-Za-z]+(?:['\u2019-][A-Za-z]+)*/g;
const CHUNK_SEPARATOR = '\n\n';
const SAFE_CHUNK_LENGTH = Math.max(
  800,
  Math.min(Speech.maxSpeechInputLength || 4000, 3800),
);

type SpeechSection = {
  text: string;
  words: ArticleSpeechWord[];
};

export function createArticleSpeechChunks(blocks?: ArticleBlock[]): ArticleSpeechChunk[] {
  const sections = createSpeechSections(blocks);
  const chunks: ArticleSpeechChunk[] = [];
  let currentChunkText = '';
  let currentChunkWords: ArticleSpeechWord[] = [];

  sections.forEach((section) => {
    if (section.words.length === 0) {
      return;
    }

    const separator = currentChunkText ? CHUNK_SEPARATOR : '';
    const nextLength = currentChunkText.length + separator.length + section.text.length;

    if (currentChunkText && nextLength > SAFE_CHUNK_LENGTH) {
      chunks.push({
        text: currentChunkText,
        words: currentChunkWords,
      });
      currentChunkText = '';
      currentChunkWords = [];
    }

    const charOffset = currentChunkText ? currentChunkText.length + CHUNK_SEPARATOR.length : 0;
    currentChunkText = currentChunkText
      ? `${currentChunkText}${CHUNK_SEPARATOR}${section.text}`
      : section.text;
    currentChunkWords = [
      ...currentChunkWords,
      ...section.words.map((word) => ({
        ...word,
        charEnd: word.charEnd + charOffset,
        charStart: word.charStart + charOffset,
      })),
    ];
  });

  if (currentChunkWords.length > 0) {
    chunks.push({
      text: currentChunkText,
      words: currentChunkWords,
    });
  }

  return chunks;
}

function createSpeechSections(blocks?: ArticleBlock[]): SpeechSection[] {
  if (!blocks) {
    return [];
  }

  const sections: SpeechSection[] = [];

  blocks.forEach((block, blockIndex) => {
    const blockKey =
      block.type === 'heading'
        ? createHeadingKey(block, blockIndex)
        : `block-${blockIndex}`;

    if (block.type === 'paragraph') {
      appendSpeechSection(sections, block.children, blockKey);
      return;
    }

    if (block.type === 'list') {
      block.items.forEach((item, itemIndex) => {
        appendSpeechSection(
          sections,
          item,
          `${blockKey}-item-${itemIndex}`,
        );
      });
    }
  });

  return sections;
}

function appendSpeechSection(
  sections: SpeechSection[],
  nodes: InlineNode[],
  prefix: string,
) {
  const normalizedNodes = normalizeInlineNodesForSpeech(nodes);
  const text = createInlineText(normalizedNodes);
  const trimmedText = text.trim();

  if (!trimmedText) {
    return;
  }

  sections.push({
    text: trimmedText,
    words: createSpeechWords(normalizedNodes, prefix, text.indexOf(trimmedText)),
  });
}

function createInlineText(nodes: InlineNode[]): string {
  return nodes.map((node) => node.text).join('');
}

function createSpeechWords(
  nodes: InlineNode[],
  prefix: string,
  trimOffset: number,
): ArticleSpeechWord[] {
  const words: ArticleSpeechWord[] = [];
  let cursor = 0;

  nodes.forEach((node, index) => {
    const charStart = cursor - trimOffset;
    const charEnd = charStart + node.text.length;

    if (node.type === 'word' && charEnd > 0) {
      words.push({
        charEnd,
        charStart: Math.max(0, charStart),
        text: node.text,
        tokenKey: `${prefix}-word-${index}-${Math.max(0, charStart)}`,
      });
    }

    cursor += node.text.length;
  });

  return words;
}

function normalizeInlineNodesForSpeech(nodes: InlineNode[]): InlineNode[] {
  const normalized: InlineNode[] = [];

  nodes.forEach((node) => {
    if (node.type === 'word') {
      normalized.push(node);
      return;
    }

    normalized.push(...splitTextNodeToInlineNodes(node));
  });

  return normalized;
}

function splitTextNodeToInlineNodes(node: Extract<InlineNode, { type: 'text' }>): InlineNode[] {
  const result: InlineNode[] = [];
  let cursor = 0;

  for (const match of node.text.matchAll(WORD_PATTERN)) {
    const matchedWord = match[0];
    const start = match.index ?? 0;

    if (cursor < start) {
      result.push({
        bold: node.bold,
        italic: node.italic,
        text: node.text.slice(cursor, start),
        type: 'text',
      });
    }

    result.push({
      bold: node.bold,
      italic: node.italic,
      text: matchedWord,
      type: 'word',
    });
    cursor = start + matchedWord.length;
  }

  if (cursor < node.text.length) {
    result.push({
      bold: node.bold,
      italic: node.italic,
      text: node.text.slice(cursor),
      type: 'text',
    });
  }

  if (result.length === 0) {
    return [node];
  }

  return result;
}

function createHeadingKey(
  block: Extract<ArticleBlock, { type: 'heading' }>,
  index: number,
): string {
  return `heading-${index}-${block.text}`;
}
