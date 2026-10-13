import { Injectable, Logger } from '@nestjs/common';

import { ArticleQuizResponseParser } from '../quiz/article-quiz-response-parser';
import {
  type ArticleBlock,
  type ArticleQuizQuestion,
  type TableCell,
} from '../contracts/types';

export type SimplificationModelResponse = {
  adaptedBlocks: ArticleBlock[];
  questions?: ArticleQuizQuestion[];
};

@Injectable()
export class ArticleAdaptationResponseParser {
  private readonly logger = new Logger(ArticleAdaptationResponseParser.name);

  constructor(private readonly quizResponseParser: ArticleQuizResponseParser) {}

  private createPlainTextInlineNodes(
    text: string,
  ): { text: string; type: 'text' }[] {
    return [{ text, type: 'text' }];
  }

  parseSimplificationModelResponse(
    rawResponse: string,
  ): SimplificationModelResponse {
    if (!rawResponse) {
      return { adaptedBlocks: [] };
    }

    const parsedJson = this.quizResponseParser.parseJsonObject<{
      adaptedBlocks?: unknown;
      adaptedText?: unknown;
      content?: unknown;
      questions?: unknown;
      text?: unknown;
    }>(rawResponse);

    if (parsedJson.parsed) {
      const adaptedBlocks = this.normalizeArticleBlocks(
        parsedJson.parsed.adaptedBlocks,
      );
      const questions = this.quizResponseParser.normalizeQuestions(
        parsedJson.parsed.questions,
      );

      if (adaptedBlocks.length > 0) {
        return {
          adaptedBlocks,
          questions: questions.length > 0 ? questions : undefined,
        };
      }

      const fallbackText =
        this.getStringValue(parsedJson.parsed.adaptedText) ||
        this.getStringValue(parsedJson.parsed.text) ||
        this.getStringValue(parsedJson.parsed.content) ||
        this.extractLooseArticleText(parsedJson.parsed);
      const fallbackBlocks = this.createParagraphBlocksFromText(fallbackText);

      if (fallbackBlocks.length > 0) {
        this.logger.warn(
          `Simplification response used text fallback after empty adaptedBlocks. Diagnostics: ${parsedJson.diagnostics.join(' | ') || 'none'}`,
        );
        return {
          adaptedBlocks: fallbackBlocks,
          questions: questions.length > 0 ? questions : undefined,
        };
      }
    }

    const rawTextFallback =
      this.createFallbackArticleBlocksFromRawResponse(rawResponse);

    if (rawTextFallback.length > 0) {
      this.logger.warn(
        `Simplification response used raw-text fallback because structured JSON blocks were unavailable.`,
      );
      return { adaptedBlocks: rawTextFallback };
    }

    this.logger.warn(
      `Simplification response could not be normalized into article blocks. Raw AI response: ${this.quizResponseParser.truncateForLog(rawResponse)}`,
    );
    return { adaptedBlocks: [] };
  }

  private createFallbackArticleBlocksFromRawResponse(
    rawResponse: string,
  ): ArticleBlock[] {
    const normalized =
      this.quizResponseParser.stripJsonMarkdownFences(rawResponse);

    if (
      !normalized ||
      normalized.startsWith('{') ||
      normalized.startsWith('[')
    ) {
      return [];
    }

    return this.createParagraphBlocksFromText(normalized);
  }

  private createParagraphBlocksFromText(text: string): ArticleBlock[] {
    if (!text.trim()) {
      return [];
    }

    return text
      .split(/\n\s*\n/g)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((paragraph) => ({
        children: this.createPlainTextInlineNodes(paragraph),
        type: 'paragraph' as const,
      }));
  }

  private normalizeArticleBlocks(rawBlocks: unknown): ArticleBlock[] {
    if (!Array.isArray(rawBlocks)) {
      return [];
    }

    return rawBlocks
      .map((block) => this.normalizeArticleBlock(block))
      .filter((block): block is ArticleBlock => block !== null);
  }

  private normalizeArticleBlock(rawBlock: unknown): ArticleBlock | null {
    if (typeof rawBlock === 'string') {
      const text = rawBlock.trim();

      return text
        ? {
            children: this.createPlainTextInlineNodes(text),
            type: 'paragraph',
          }
        : null;
    }

    if (!rawBlock || typeof rawBlock !== 'object') {
      return null;
    }

    const candidate = rawBlock as Record<string, unknown>;
    const type = candidate.type;

    if (type === 'heading') {
      const text = this.getStringValue(candidate.text);
      const level =
        candidate.level === 1 || candidate.level === 2 || candidate.level === 3
          ? candidate.level
          : 2;

      return text ? { level, text, type } : null;
    }

    if (type === 'paragraph') {
      const children = this.normalizeInlineNodes(candidate.children);
      const fallbackText = this.getStringValue(candidate.text);

      if (children.length > 0) {
        return { children, type };
      }

      return fallbackText
        ? { children: this.createPlainTextInlineNodes(fallbackText), type }
        : null;
    }

    if (type === 'list') {
      const rawItems = Array.isArray(candidate.items) ? candidate.items : [];
      const items = rawItems
        .map((item) => this.normalizeInlineNodes(item))
        .filter((item) => item.length > 0);

      return items.length > 0
        ? { items, ordered: candidate.ordered === true, type }
        : null;
    }

    if (type === 'table') {
      const rows = this.normalizeTableRows(candidate.rows);

      return rows.length > 0 ? { rows, type } : null;
    }

    if (type === 'formula') {
      const altText = this.getStringValue(candidate.altText);

      return altText
        ? {
            altText,
            display: candidate.display !== false,
            type,
          }
        : null;
    }

    if (type === 'image') {
      const src = this.getStringValue(candidate.src);

      return src
        ? {
            alt: this.getStringValue(candidate.alt) || undefined,
            caption: this.getStringValue(candidate.caption) || undefined,
            src,
            type,
          }
        : null;
    }

    return null;
  }

  private normalizeInlineNodes(
    rawNodes: unknown,
  ): { text: string; type: 'text' }[] {
    if (typeof rawNodes === 'string') {
      return this.createPlainTextInlineNodes(rawNodes);
    }

    if (!Array.isArray(rawNodes)) {
      return [];
    }

    return rawNodes
      .map((node) => {
        if (typeof node === 'string') {
          return { text: node.trim(), type: 'text' as const };
        }

        if (!node || typeof node !== 'object') {
          return null;
        }

        const text = this.getStringValue(
          (node as Record<string, unknown>).text,
        );

        return text ? { text, type: 'text' as const } : null;
      })
      .filter((node): node is { text: string; type: 'text' } => node !== null);
  }

  private normalizeTableRows(rawRows: unknown): TableCell[][] {
    if (!Array.isArray(rawRows)) {
      return [];
    }

    return rawRows
      .map((row) => this.normalizeTableRow(row))
      .filter((row) => row.length > 0);
  }

  private normalizeTableRow(rawRow: unknown): TableCell[] {
    if (Array.isArray(rawRow)) {
      return rawRow
        .map((cell) => this.normalizeTableCell(cell))
        .filter((cell): cell is TableCell => cell !== null);
    }

    if (!rawRow || typeof rawRow !== 'object') {
      const cell = this.normalizeTableCell(rawRow);

      return cell ? [cell] : [];
    }

    const candidate = rawRow as Record<string, unknown>;

    if (Array.isArray(candidate.cells)) {
      return this.normalizeTableRow(candidate.cells);
    }

    return Object.values(candidate)
      .map((cell) => this.normalizeTableCell(cell))
      .filter((cell): cell is TableCell => cell !== null);
  }

  private normalizeTableCell(rawCell: unknown): TableCell | null {
    const text =
      typeof rawCell === 'string' || typeof rawCell === 'number'
        ? String(rawCell).trim()
        : rawCell && typeof rawCell === 'object'
          ? this.getStringValue(
              (rawCell as Record<string, unknown>).text ??
                (rawCell as Record<string, unknown>).value ??
                (rawCell as Record<string, unknown>).content,
            )
          : '';

    if (!text) {
      return null;
    }

    return {
      header:
        rawCell && typeof rawCell === 'object'
          ? (rawCell as Record<string, unknown>).header === true || undefined
          : undefined,
      text,
    };
  }

  private getStringValue(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private extractLooseArticleText(value: unknown, depth = 0): string {
    if (depth > 4) {
      return '';
    }

    if (typeof value === 'string') {
      return value.trim();
    }

    if (Array.isArray(value)) {
      return value
        .map((item) => this.extractLooseArticleText(item, depth + 1))
        .filter(Boolean)
        .join('\n\n')
        .trim();
    }

    if (!value || typeof value !== 'object') {
      return '';
    }

    const candidate = value as Record<string, unknown>;
    const prioritizedKeys = [
      'adaptedText',
      'text',
      'content',
      'paragraph',
      'paragraphs',
      'body',
      'article',
      'adaptation',
      'adapted',
      'rewrite',
      'rewrittenText',
      'summary',
    ];

    for (const key of prioritizedKeys) {
      if (!(key in candidate)) {
        continue;
      }

      const extracted = this.extractLooseArticleText(candidate[key], depth + 1);

      if (extracted) {
        return extracted;
      }
    }

    return Object.entries(candidate)
      .filter(
        ([key]) => !['questions', 'options', 'correctOptionIds'].includes(key),
      )
      .map(([, nestedValue]) =>
        this.extractLooseArticleText(nestedValue, depth + 1),
      )
      .filter(Boolean)
      .join('\n\n')
      .trim();
  }
}
