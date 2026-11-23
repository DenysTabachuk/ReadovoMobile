import { Injectable } from '@nestjs/common';

import {
  type ArticleBlock,
  type ArticleTextTransformationType,
} from '../contracts/types';

const MAX_ADAPTATION_CHUNK_CHARS = 30_000;
const MAX_SUMMARY_CHUNK_CHARS = 12_000;

export type SimplificationChunk = {
  blocks?: ArticleBlock[];
  index: number;
  text: string;
  total: number;
};

@Injectable()
export class ArticleContentProcessor {
  getMaxTransformationChunkChars(
    transformationType: ArticleTextTransformationType,
  ): number {
    return transformationType === 'summary'
      ? MAX_SUMMARY_CHUNK_CHARS
      : MAX_ADAPTATION_CHUNK_CHARS;
  }

  shouldChunkSimplificationInput(params: {
    maxChunkChars: number;
    sourceBlocks?: ArticleBlock[];
    text: string;
  }): boolean {
    if (params.text.length > params.maxChunkChars) {
      return true;
    }

    if (!params.sourceBlocks?.length) {
      return false;
    }

    const blockPromptLength = params.sourceBlocks.reduce(
      (total, block) => total + this.getArticleBlockPromptText(block).length,
      0,
    );

    return blockPromptLength > params.maxChunkChars;
  }

  createSimplificationChunks(params: {
    maxChunkChars: number;
    sourceBlocks?: ArticleBlock[];
    text: string;
  }): SimplificationChunk[] {
    if (params.sourceBlocks?.length) {
      return this.createBlockSimplificationChunks(
        params.sourceBlocks,
        params.maxChunkChars,
      );
    }

    return this.createTextSimplificationChunks(
      params.text,
      params.maxChunkChars,
    );
  }

  private createBlockSimplificationChunks(
    sourceBlocks: ArticleBlock[],
    maxChunkChars: number,
  ): SimplificationChunk[] {
    const splitBlocks = sourceBlocks.flatMap((block) =>
      this.splitOversizedBlock(block, maxChunkChars),
    );
    const chunkBlocks: ArticleBlock[][] = [];
    let currentBlocks: ArticleBlock[] = [];
    let currentLength = 0;

    const flushChunk = () => {
      if (currentBlocks.length === 0) {
        return;
      }

      chunkBlocks.push(currentBlocks);
      currentBlocks = [];
      currentLength = 0;
    };

    for (const block of splitBlocks) {
      const blockLength = this.getArticleBlockPromptText(block).length;

      if (
        currentBlocks.length > 0 &&
        currentLength + blockLength > maxChunkChars
      ) {
        flushChunk();
      }

      currentBlocks.push(block);
      currentLength += blockLength;
    }

    flushChunk();

    return chunkBlocks.map((blocks, index) => ({
      blocks,
      index: index + 1,
      text: this.extractPlainTextFromArticleBlocks(blocks),
      total: chunkBlocks.length,
    }));
  }

  private createTextSimplificationChunks(
    text: string,
    maxChunkChars: number,
  ): SimplificationChunk[] {
    const paragraphs = text
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
    const chunks: string[] = [];
    let currentChunk = '';

    const appendTextPart = (part: string) => {
      if (!currentChunk) {
        currentChunk = part;
        return;
      }

      if (currentChunk.length + part.length + 2 > maxChunkChars) {
        chunks.push(currentChunk);
        currentChunk = part;
        return;
      }

      currentChunk = `${currentChunk}\n\n${part}`;
    };

    for (const paragraph of paragraphs) {
      if (paragraph.length <= maxChunkChars) {
        appendTextPart(paragraph);
        continue;
      }

      for (const sentenceGroup of this.splitTextBySentences(
        paragraph,
        maxChunkChars,
      )) {
        appendTextPart(sentenceGroup);
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks.map((chunkText, index) => ({
      index: index + 1,
      text: chunkText,
      total: chunks.length,
    }));
  }

  private splitOversizedBlock(
    block: ArticleBlock,
    maxChunkChars: number,
  ): ArticleBlock[] {
    const blockLength = this.getArticleBlockPromptText(block).length;

    if (blockLength <= maxChunkChars) {
      return [block];
    }

    if (block.type === 'paragraph') {
      return this.splitTextBySentences(
        this.extractTextFromInlineNodes(block.children),
        maxChunkChars,
      ).map((text) => ({
        children: this.createPlainTextInlineNodes(text),
        type: 'paragraph',
      }));
    }

    if (block.type === 'list') {
      return block.items.map((item) => ({
        items: [item],
        ordered: block.ordered,
        type: 'list',
      }));
    }

    if (block.type === 'table') {
      const chunks: ArticleBlock[] = [];
      let currentRows: typeof block.rows = [];
      let currentLength = 0;

      for (const row of block.rows) {
        const rowLength = row.map((cell) => cell.text).join(' | ').length;

        if (
          currentRows.length > 0 &&
          currentLength + rowLength > maxChunkChars
        ) {
          chunks.push({ rows: currentRows, type: 'table' });
          currentRows = [];
          currentLength = 0;
        }

        currentRows.push(row);
        currentLength += rowLength;
      }

      if (currentRows.length > 0) {
        chunks.push({ rows: currentRows, type: 'table' });
      }

      return chunks;
    }

    return [block];
  }

  private splitTextBySentences(text: string, maxChunkChars: number): string[] {
    const sentences =
      text
        .match(/[^.!?\n]+(?:[.!?]+(?=\s|$)|$)/g)
        ?.map((sentence) => sentence.trim()) ?? [];

    if (sentences.length === 0) {
      return [text.slice(0, maxChunkChars)];
    }

    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      const sentenceParts =
        sentence.length > maxChunkChars
          ? this.splitOversizedSentence(sentence, maxChunkChars)
          : [sentence];

      for (const sentencePart of sentenceParts) {
        if (!currentChunk) {
          currentChunk = sentencePart;
          continue;
        }

        if (currentChunk.length + sentencePart.length + 1 > maxChunkChars) {
          chunks.push(currentChunk);
          currentChunk = sentencePart;
          continue;
        }

        currentChunk = `${currentChunk} ${sentencePart}`;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  private splitOversizedSentence(
    sentence: string,
    maxChunkChars: number,
  ): string[] {
    const words = sentence.split(/\s+/).filter(Boolean);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const word of words) {
      if (!currentChunk) {
        currentChunk = word;
        continue;
      }

      if (currentChunk.length + word.length + 1 > maxChunkChars) {
        chunks.push(currentChunk);
        currentChunk = word;
        continue;
      }

      currentChunk = `${currentChunk} ${word}`;
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  formatArticleBlocksForPrompt(blocks?: ArticleBlock[]): string {
    if (!blocks?.length) {
      return 'No structured source blocks were provided.';
    }

    return blocks
      .map((block, index) => {
        const sourceId = `source-${index + 1}`;

        if (block.type === 'image') {
          return JSON.stringify({
            alt: block.alt,
            caption: block.caption,
            sourceId,
            src: block.src,
            type: block.type,
          });
        }

        if (block.type === 'table') {
          return JSON.stringify({
            rows: block.rows,
            sourceId,
            type: block.type,
          });
        }

        if (block.type === 'heading') {
          return JSON.stringify({
            level: block.level,
            sourceId,
            text: block.text,
            type: block.type,
          });
        }

        if (block.type === 'formula') {
          return JSON.stringify({
            altText: block.altText,
            sourceId,
            type: block.type,
          });
        }

        return JSON.stringify({
          sourceId,
          text: this.getArticleBlockPromptText(block),
          type: block.type,
        });
      })
      .join('\n');
  }

  private getArticleBlockPromptText(block: ArticleBlock): string {
    if (block.type === 'heading') {
      return block.text.trim();
    }

    if (block.type === 'paragraph') {
      return this.extractTextFromInlineNodes(block.children);
    }

    if (block.type === 'list') {
      return block.items
        .map((item) => this.extractTextFromInlineNodes(item))
        .join('\n');
    }

    if (block.type === 'table') {
      return block.rows
        .map((row) => row.map((cell) => cell.text.trim()).join(' | '))
        .join('\n');
    }

    if (block.type === 'formula') {
      return block.altText.trim();
    }

    return [block.alt, block.caption].filter(Boolean).join(' ').trim();
  }

  extractPlainTextFromArticleBlocks(blocks: ArticleBlock[]): string {
    return blocks
      .map((block) => this.getArticleBlockPromptText(block))
      .filter(Boolean)
      .join('\n\n')
      .trim();
  }

  private extractTextFromInlineNodes(nodes: { text: string }[]): string {
    return nodes
      .map((node) => node.text)
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private createPlainTextInlineNodes(
    text: string,
  ): { text: string; type: 'text' }[] {
    return [{ text, type: 'text' }];
  }

  countWords(text: string): number {
    return text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g)?.length ?? 0;
  }
}
