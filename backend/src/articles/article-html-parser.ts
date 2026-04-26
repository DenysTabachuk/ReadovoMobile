import { parse, type DefaultTreeAdapterMap } from 'parse5';

import { type ArticleBlock, type InlineNode, type TableCell } from './types';

type HtmlChildNode = DefaultTreeAdapterMap['childNode'];
type HtmlElement = DefaultTreeAdapterMap['element'];
type HtmlNode = DefaultTreeAdapterMap['node'];
type HtmlParentNode = DefaultTreeAdapterMap['parentNode'];

type InlineFormatting = {
  bold?: boolean;
  italic?: boolean;
};

type RawInlineSegment = InlineFormatting & {
  text: string;
};

const BLOCK_TAGS = new Set([
  'article',
  'aside',
  'body',
  'caption',
  'dd',
  'div',
  'dl',
  'dt',
  'figcaption',
  'figure',
  'footer',
  'header',
  'li',
  'main',
  'nav',
  'section',
]);
const FORMATTING_BOLD_TAGS = new Set(['b', 'strong']);
const FORMATTING_ITALIC_TAGS = new Set(['cite', 'dfn', 'em', 'i']);
const IMAGE_CONTAINER_TAGS = new Set(['figure']);
const INLINE_BREAK_TAGS = new Set(['br', 'hr']);
const INLINE_WRAPPER_TAGS = new Set([
  'a',
  'abbr',
  'code',
  'mark',
  'q',
  's',
  'small',
  'span',
  'sub',
  'sup',
  'time',
  'u',
]);
const IGNORED_CLASS_PATTERNS = [
  'ambox',
  'authority-control',
  'catlinks',
  'external text',
  'hatnote',
  'metadata',
  'mw-editsection',
  'mw-empty-elt',
  'mw-jump-link',
  'mw-references-wrap',
  'navbox',
  'noprint',
  'portal',
  'reference',
  'reflist',
  'sistersitebox',
  'shortdescription',
  'sidebar',
  'succession-box',
  'toc',
];
const IGNORED_ID_PATTERNS = ['cite_note', 'mw-toc-heading'];
const IGNORED_TAGS = new Set([
  'audio',
  'link',
  'meta',
  'noscript',
  'script',
  'style',
  'template',
]);
const IGNORED_SECTION_TITLES = new Set([
  'bibliography',
  'citations',
  'external links',
  'further reading',
  'notes',
  'references',
  'see also',
  'sources',
  'works cited',
]);
const WORD_PATTERN = /[A-Za-z]+(?:['\u2019-][A-Za-z]+)*/g;

export function parseHtmlToBlocks(html: string): ArticleBlock[] {
  const normalizedHtml = html.trim();

  if (!normalizedHtml) {
    return [];
  }

  try {
    const document = parse(normalizedHtml);
    const blocks = parseNodesToBlocks(document.childNodes);

    return removeEmptyTextBlocks(
      removeEmptyHeadings(removeIgnoredSections(blocks)),
    );
  } catch {
    return createFallbackParagraphBlocks(html);
  }
}

export function parseInlineNodes(parentNode: HtmlParentNode | HtmlChildNode): InlineNode[] {
  const segments = collectInlineSegments(parentNode, {});
  const inlineNodes = convertSegmentsToInlineNodes(segments);

  return mergeAdjacentInlineNodes(inlineNodes);
}

export function extractPlainTextFromBlocks(blocks: ArticleBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === 'heading') {
        return block.text.trim();
      }

      if (block.type === 'paragraph') {
        return extractTextFromInlineNodes(block.children);
      }

      if (block.type === 'list') {
        return block.items
          .map((item) => extractTextFromInlineNodes(item))
          .filter(Boolean)
          .join('\n');
      }

      if (block.type === 'table') {
        return block.rows
          .map((row) => row.map((cell) => cell.text.trim()).filter(Boolean).join(' | '))
          .filter(Boolean)
          .join('\n');
      }

      return [block.alt, block.caption].filter(Boolean).join(' ').trim();
    })
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

function parseNodesToBlocks(nodes: HtmlChildNode[]): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];

  for (const node of nodes) {
    if (!isElementNode(node)) {
      continue;
    }

    if (shouldIgnoreElement(node)) {
      continue;
    }

    if (isHeadingTag(node.tagName)) {
      const text = normalizeWhitespace(extractElementText(node));

      if (text) {
        blocks.push({
          level: Number(node.tagName.slice(1)) as 1 | 2 | 3,
          text,
          type: 'heading',
        });
      }

      continue;
    }

    if (node.tagName === 'p') {
      const children = parseInlineNodes(node);

      if (hasVisibleInlineContent(children)) {
        blocks.push({
          children,
          type: 'paragraph',
        });
      }

      continue;
    }

    if (node.tagName === 'ul' || node.tagName === 'ol') {
      const items = parseListItems(node);

      if (items.length > 0) {
        blocks.push({
          items,
          ordered: node.tagName === 'ol',
          type: 'list',
        });
      }

      continue;
    }

    if (node.tagName === 'table') {
      const infoboxImageBlock = parseInfoboxImageBlock(node);

      if (infoboxImageBlock) {
        blocks.push(infoboxImageBlock);
      }

      const rows = parseTableRows(node);

      if (rows.length > 0) {
        blocks.push({
          rows,
          type: 'table',
        });
      }

      continue;
    }

    const imageBlock = parseImageBlock(node);

    if (imageBlock) {
      blocks.push(imageBlock);
      continue;
    }

    blocks.push(...parseNodesToBlocks(node.childNodes));
  }

  return blocks;
}

function parseListItems(listNode: HtmlElement): InlineNode[][] {
  const items: InlineNode[][] = [];

  for (const childNode of listNode.childNodes) {
    if (!isElementNode(childNode) || childNode.tagName !== 'li') {
      continue;
    }

    if (shouldIgnoreElement(childNode)) {
      continue;
    }

    const nodes = parseInlineNodes(childNode);

    if (hasVisibleInlineContent(nodes)) {
      items.push(nodes);
    }
  }

  return items;
}

function parseTableRows(tableNode: HtmlElement): TableCell[][] {
  const rows: TableCell[][] = [];
  const tableCaption = normalizeWhitespace(extractTableCaption(tableNode) ?? '');
  const infoboxImageCaption = isInfoboxElement(tableNode)
    ? normalizeWhitespace(extractInfoboxImageCaption(tableNode) ?? '')
    : '';

  if (tableCaption) {
    rows.push([
      {
        header: true,
        text: tableCaption,
      },
    ]);
  }

  walkElementChildren(tableNode, (element) => {
    if (element.tagName !== 'tr' || shouldIgnoreElement(element)) {
      return;
    }

    const cells = element.childNodes
      .filter((childNode): childNode is HtmlElement => {
        return (
          isElementNode(childNode) &&
          !shouldIgnoreElement(childNode) &&
          (childNode.tagName === 'th' || childNode.tagName === 'td')
        );
      })
      .map((cell) => {
        const text = normalizeWhitespace(extractElementText(cell));

        return {
          header: cell.tagName === 'th' ? true : undefined,
          text,
        } satisfies TableCell;
      })
      .filter((cell) => Boolean(cell.text));

    if (
      infoboxImageCaption &&
      cells.length === 1 &&
      cells[0]?.text === infoboxImageCaption
    ) {
      return;
    }

    if (cells.length > 0) {
      rows.push(cells);
    }
  });

  return rows;
}

function parseImageBlock(node: HtmlElement): Extract<ArticleBlock, { type: 'image' }> | null {
  if (!IMAGE_CONTAINER_TAGS.has(node.tagName) && node.tagName !== 'img') {
    return null;
  }

  const imageNode = node.tagName === 'img' ? node : findFirstDescendant(node, 'img');

  if (!imageNode || shouldIgnoreElement(imageNode)) {
    return null;
  }

  const src = normalizeImageSource(getAttribute(imageNode, 'src'));

  if (!src) {
    return null;
  }

  const alt = normalizeWhitespace(getAttribute(imageNode, 'alt') ?? '');
  const caption =
    node.tagName === 'img'
      ? undefined
      : normalizeWhitespace(extractFigureCaption(node) ?? '');

  return {
    alt: alt || undefined,
    caption: caption || undefined,
    src,
    type: 'image',
  };
}

function parseInfoboxImageBlock(
  node: HtmlElement,
): Extract<ArticleBlock, { type: 'image' }> | null {
  if (node.tagName !== 'table' || !isInfoboxElement(node)) {
    return null;
  }

  const imageNode = findFirstDescendant(node, 'img');

  if (!imageNode || shouldIgnoreElement(imageNode)) {
    return null;
  }

  const src = normalizeImageSource(getAttribute(imageNode, 'src'));

  if (!src) {
    return null;
  }

  const alt = normalizeWhitespace(getAttribute(imageNode, 'alt') ?? '');
  const caption = normalizeWhitespace(extractInfoboxImageCaption(node) ?? '');

  return {
    alt: alt || undefined,
    caption: caption || undefined,
    src,
    type: 'image',
  };
}

function collectInlineSegments(
  node: HtmlParentNode | HtmlChildNode,
  formatting: InlineFormatting,
): RawInlineSegment[] {
  if (isTextNode(node)) {
    return [{ ...formatting, text: node.value }];
  }

  if (!isElementNode(node)) {
    return [];
  }

  if (shouldIgnoreElement(node)) {
    return [];
  }

  if (INLINE_BREAK_TAGS.has(node.tagName)) {
    return [{ ...formatting, text: ' ' }];
  }

  const nextFormatting: InlineFormatting = {
    bold: formatting.bold || FORMATTING_BOLD_TAGS.has(node.tagName) || undefined,
    italic:
      formatting.italic || FORMATTING_ITALIC_TAGS.has(node.tagName) || undefined,
  };
  const segments = node.childNodes.flatMap((childNode) =>
    collectInlineSegments(childNode, nextFormatting),
  );

  if (BLOCK_TAGS.has(node.tagName) && segments.length > 0) {
    return [{ ...formatting, text: ' ' }, ...segments, { ...formatting, text: ' ' }];
  }

  if (INLINE_WRAPPER_TAGS.has(node.tagName) || node.tagName === 'img') {
    return segments;
  }

  return segments;
}

function convertSegmentsToInlineNodes(segments: RawInlineSegment[]): InlineNode[] {
  const nodes: InlineNode[] = [];

  for (const segment of segments) {
    const text = segment.text.replaceAll('\u00a0', ' ');
    let cursor = 0;

    while (cursor < text.length) {
      const currentCharacter = text[cursor];

      if (isWhitespaceCharacter(currentCharacter)) {
        while (cursor < text.length && isWhitespaceCharacter(text[cursor])) {
          cursor += 1;
        }

        appendTextNode(nodes, ' ', segment);
        continue;
      }

      let chunkEnd = cursor;

      while (chunkEnd < text.length && !isWhitespaceCharacter(text[chunkEnd])) {
        chunkEnd += 1;
      }

      appendChunkNodes(nodes, text.slice(cursor, chunkEnd), segment);
      cursor = chunkEnd;
    }
  }

  return trimWhitespaceInlineNodes(nodes);
}

function appendChunkNodes(
  nodes: InlineNode[],
  chunk: string,
  formatting: InlineFormatting,
): void {
  let cursor = 0;

  for (const match of chunk.matchAll(WORD_PATTERN)) {
    const matchedWord = match[0];
    const start = match.index ?? 0;

    if (cursor < start) {
      appendTextNode(nodes, chunk.slice(cursor, start), formatting);
    }

    nodes.push({
      ...formatting,
      text: matchedWord,
      type: 'word',
    });
    cursor = start + matchedWord.length;
  }

  if (cursor < chunk.length) {
    appendTextNode(nodes, chunk.slice(cursor), formatting);
  }
}

function appendTextNode(
  nodes: InlineNode[],
  text: string,
  formatting: InlineFormatting,
): void {
  if (!text) {
    return;
  }

  const normalizedText = normalizeWhitespace(text, { preserveInnerSpacing: true });

  if (!normalizedText) {
    return;
  }

  nodes.push({
    ...formatting,
    text: normalizedText,
    type: 'text',
  });
}

function mergeAdjacentInlineNodes(nodes: InlineNode[]): InlineNode[] {
  return nodes.reduce<InlineNode[]>((mergedNodes, node) => {
    const previousNode = mergedNodes[mergedNodes.length - 1];

    if (
      previousNode &&
      previousNode.type === node.type &&
      previousNode.bold === node.bold &&
      previousNode.italic === node.italic
    ) {
      previousNode.text += node.text;
      return mergedNodes;
    }

    mergedNodes.push({ ...node });
    return mergedNodes;
  }, []);
}

function trimWhitespaceInlineNodes(nodes: InlineNode[]): InlineNode[] {
  const nextNodes = nodes.map((node) => ({ ...node }));
  const firstNode = nextNodes[0];
  const lastNode = nextNodes[nextNodes.length - 1];

  if (firstNode?.type === 'text') {
    firstNode.text = firstNode.text.replace(/^\s+/, '');
  }

  if (lastNode?.type === 'text') {
    lastNode.text = lastNode.text.replace(/\s+$/, '');
  }

  return nextNodes.filter((node) => {
    return node.type === 'word' || node.text.length > 0;
  });
}

function extractTextFromInlineNodes(nodes: InlineNode[]): string {
  return normalizeWhitespace(nodes.map((node) => node.text).join(''));
}

function extractElementText(node: HtmlElement): string {
  return normalizeWhitespace(
    collectInlineSegments(node, {})
      .map((segment) => segment.text)
      .join(''),
  );
}

function extractFigureCaption(node: HtmlElement): string | null {
  const figcaption = findFirstDescendant(node, 'figcaption');

  if (figcaption) {
    return extractElementText(figcaption);
  }

  return null;
}

function extractTableCaption(node: HtmlElement): string | null {
  const caption = findFirstDescendant(node, 'caption');

  if (caption) {
    return extractElementText(caption);
  }

  return null;
}

function createFallbackParagraphBlocks(text: string): ArticleBlock[] {
  const content = normalizeWhitespace(stripHtmlTags(text));

  if (!content) {
    return [];
  }

  return [
    {
      children: convertSegmentsToInlineNodes([{ text: content }]),
      type: 'paragraph',
    },
  ];
}

function removeEmptyHeadings(blocks: ArticleBlock[]): ArticleBlock[] {
  return blocks.filter((block, index) => {
    if (block.type !== 'heading') {
      return true;
    }

    return hasContentAfterHeading(blocks, index);
  });
}

function removeIgnoredSections(blocks: ArticleBlock[]): ArticleBlock[] {
  const filteredBlocks: ArticleBlock[] = [];
  let skippedHeadingLevel: number | null = null;

  for (const block of blocks) {
    if (block.type === 'heading') {
      const normalizedTitle = normalizeSectionTitle(block.text);

      if (skippedHeadingLevel !== null && block.level <= skippedHeadingLevel) {
        skippedHeadingLevel = null;
      }

      if (IGNORED_SECTION_TITLES.has(normalizedTitle)) {
        skippedHeadingLevel = block.level;
        continue;
      }
    }

    if (skippedHeadingLevel !== null) {
      continue;
    }

    filteredBlocks.push(block);
  }

  return filteredBlocks;
}

function removeEmptyTextBlocks(blocks: ArticleBlock[]): ArticleBlock[] {
  return blocks.filter((block) => {
    if (block.type === 'paragraph') {
      return hasVisibleInlineContent(block.children);
    }

    if (block.type === 'list') {
      return block.items.some((item) => hasVisibleInlineContent(item));
    }

    if (block.type === 'table') {
      return block.rows.some((row) => row.some((cell) => Boolean(cell.text.trim())));
    }

    if (block.type === 'image') {
      return Boolean(block.src);
    }

    return Boolean(block.text.trim());
  });
}

function hasContentAfterHeading(blocks: ArticleBlock[], headingIndex: number): boolean {
  const headingBlock = blocks[headingIndex];

  if (!headingBlock || headingBlock.type !== 'heading') {
    return false;
  }

  for (let index = headingIndex + 1; index < blocks.length; index += 1) {
    const nextBlock = blocks[index];

    if (nextBlock.type === 'heading' && nextBlock.level <= headingBlock.level) {
      return false;
    }

    if (nextBlock.type !== 'heading') {
      return true;
    }
  }

  return false;
}

function hasVisibleInlineContent(nodes: InlineNode[]): boolean {
  return nodes.some((node) => node.text.trim().length > 0);
}

function shouldIgnoreElement(node: HtmlElement): boolean {
  if (IGNORED_TAGS.has(node.tagName)) {
    return true;
  }

  if (node.tagName === 'sup') {
    return true;
  }

  const className = getAttribute(node, 'class')?.toLowerCase() ?? '';
  const elementId = getAttribute(node, 'id')?.toLowerCase() ?? '';
  const role = getAttribute(node, 'role')?.toLowerCase();
  const style = getAttribute(node, 'style')?.toLowerCase() ?? '';
  const ariaHidden = getAttribute(node, 'aria-hidden')?.toLowerCase();

  if (node.attrs.some((attribute) => attribute.name === 'hidden')) {
    return true;
  }

  if (ariaHidden === 'true') {
    return true;
  }

  if (style.includes('display:none') || style.includes('visibility:hidden')) {
    return true;
  }

  if (role === 'navigation') {
    return true;
  }

  if (IGNORED_CLASS_PATTERNS.some((pattern) => className.includes(pattern))) {
    return true;
  }

  if (IGNORED_ID_PATTERNS.some((pattern) => elementId.includes(pattern))) {
    return true;
  }

  if (getAttribute(node, 'typeof')?.includes('mw:Extension/references')) {
    return true;
  }

  return false;
}

function isInfoboxElement(node: HtmlElement): boolean {
  const className = getAttribute(node, 'class')?.toLowerCase() ?? '';

  return className.includes('infobox');
}

function getAttribute(node: HtmlElement, attributeName: string): string | undefined {
  return node.attrs.find((attribute) => attribute.name === attributeName)?.value;
}

function findFirstDescendant(
  parentNode: HtmlElement,
  tagName: string,
): HtmlElement | null {
  for (const childNode of parentNode.childNodes) {
    if (!isElementNode(childNode) || shouldIgnoreElement(childNode)) {
      continue;
    }

    if (childNode.tagName === tagName) {
      return childNode;
    }

    const nestedMatch = findFirstDescendant(childNode, tagName);

    if (nestedMatch) {
      return nestedMatch;
    }
  }

  return null;
}

function extractInfoboxImageCaption(node: HtmlElement): string | null {
  const captionNode = findDescendantByClassName(node, 'infobox-caption');

  if (captionNode) {
    return extractElementText(captionNode);
  }

  return null;
}

function findDescendantByClassName(
  parentNode: HtmlElement,
  classNamePattern: string,
): HtmlElement | null {
  for (const childNode of parentNode.childNodes) {
    if (!isElementNode(childNode) || shouldIgnoreElement(childNode)) {
      continue;
    }

    const className = getAttribute(childNode, 'class')?.toLowerCase() ?? '';

    if (className.includes(classNamePattern)) {
      return childNode;
    }

    const nestedMatch = findDescendantByClassName(childNode, classNamePattern);

    if (nestedMatch) {
      return nestedMatch;
    }
  }

  return null;
}

function walkElementChildren(
  parentNode: HtmlElement,
  callback: (element: HtmlElement) => void,
): void {
  for (const childNode of parentNode.childNodes) {
    if (!isElementNode(childNode) || shouldIgnoreElement(childNode)) {
      continue;
    }

    callback(childNode);
    walkElementChildren(childNode, callback);
  }
}

function normalizeImageSource(src?: string): string | undefined {
  if (!src) {
    return undefined;
  }

  if (src.startsWith('//')) {
    return `https:${src}`;
  }

  if (src.startsWith('/')) {
    return `https://en.wikipedia.org${src}`;
  }

  return src;
}

function normalizeWhitespace(
  text: string,
  options: { preserveInnerSpacing?: boolean } = {},
): string {
  const cleanedText = text.replace(/\u00a0/g, ' ');

  if (options.preserveInnerSpacing) {
    return cleanedText.replace(/\s+/g, ' ');
  }

  return cleanedText.replace(/\s+/g, ' ').trim();
}

function normalizeSectionTitle(title: string): string {
  return title.replace(/\s+/g, ' ').trim().toLowerCase();
}

function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]+>/g, ' ');
}

function isHeadingTag(tagName: string): tagName is 'h1' | 'h2' | 'h3' {
  return tagName === 'h1' || tagName === 'h2' || tagName === 'h3';
}

function isElementNode(node: HtmlNode): node is HtmlElement {
  return 'tagName' in node;
}

function isTextNode(node: HtmlNode): node is DefaultTreeAdapterMap['textNode'] {
  return node.nodeName === '#text';
}

function isWhitespaceCharacter(character: string | undefined): boolean {
  return character !== undefined && /\s/.test(character);
}
