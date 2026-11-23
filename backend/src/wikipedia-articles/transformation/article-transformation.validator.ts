import { Injectable } from '@nestjs/common';

import {
  type AiArticleBlock,
  type ArticleTransformationOutput,
} from '../contracts/ai-output.schemas';
import { type SemanticValidationResult } from '../contracts/semantic-validation';
import {
  type ArticleBlock,
  type ArticleQuizQuestion,
  type InlineNode,
  type TableCell,
} from '../contracts/types';
import { ArticleQuizValidator } from '../quiz/article-quiz.validator';

export type SimplificationModelResponse = {
  adaptedBlocks: ArticleBlock[];
  questions?: import('../contracts/types').ArticleQuizQuestion[];
};

type TransformationValidationParams = {
  allowedImageSources: Set<string>;
  questionPolicy: 'allowed' | 'forbidden' | 'required';
};

@Injectable()
export class ArticleTransformationValidator {
  constructor(private readonly quizValidator: ArticleQuizValidator) {}

  validate(
    output: ArticleTransformationOutput,
    params: TransformationValidationParams,
  ): SemanticValidationResult<SimplificationModelResponse> {
    const issues: string[] = [];
    const adaptedBlocks = output.adaptedBlocks.flatMap((block, index) => {
      const result = this.validateBlock(
        block,
        index,
        params.allowedImageSources,
      );
      if (!result.success) {
        issues.push(...result.issues);
        return [];
      }

      return [result.data];
    });

    if (adaptedBlocks.length === 0) {
      issues.push('At least one non-empty adapted block is required.');
    }

    let questions: ArticleQuizQuestion[] | undefined;
    if (output.questions && params.questionPolicy === 'forbidden') {
      issues.push('This transformation output must not contain questions.');
    } else if (output.questions) {
      const questionResult = this.quizValidator.validate(output.questions);
      if (!questionResult.success) {
        issues.push(...questionResult.issues);
      } else {
        questions = questionResult.data;
      }
    } else if (params.questionPolicy === 'required') {
      issues.push('Summary output must contain comprehension questions.');
    }

    if (issues.length > 0) return { issues, success: false };

    return {
      data: {
        adaptedBlocks,
        ...(questions ? { questions } : {}),
      },
      issues: [],
      success: true,
    };
  }

  private validateBlock(
    block: AiArticleBlock,
    index: number,
    allowedImageSources: Set<string>,
  ): SemanticValidationResult<ArticleBlock> {
    const label = `Block ${index + 1}`;

    if (block.type === 'heading') {
      const text = block.text.trim();
      return text
        ? { data: { ...block, text }, issues: [], success: true }
        : {
            issues: [`${label}: heading text must not be empty.`],
            success: false,
          };
    }

    if (block.type === 'paragraph') {
      const children = this.mapInlineNodes(block.children);
      if (block.children.some(({ text }) => text.length === 0)) {
        return {
          issues: [`${label}: inline text nodes must not be empty.`],
          success: false,
        };
      }
      return children.some(({ text }) => text.trim())
        ? {
            data: { children, type: 'paragraph' },
            issues: [],
            success: true,
          }
        : {
            issues: [`${label}: paragraph must contain visible text.`],
            success: false,
          };
    }

    if (block.type === 'list') {
      const items = block.items.map((item) => this.mapInlineNodes(item));
      const hasInvalidItem = block.items.some(
        (item) =>
          item.some(({ text }) => text.length === 0) ||
          !item.some(({ text }) => text.trim()),
      );
      return items.length > 0 && !hasInvalidItem
        ? {
            data: { items, ordered: block.ordered, type: 'list' },
            issues: [],
            success: true,
          }
        : {
            issues: [`${label}: list items must contain visible text.`],
            success: false,
          };
    }

    if (block.type === 'table') {
      const rows = block.rows.map((row) => this.mapTableCells(row));
      const hasInvalidCell = block.rows.some(
        (row) => row.length === 0 || row.some(({ text }) => !text.trim()),
      );
      return rows.length > 0 && !hasInvalidCell
        ? { data: { rows, type: 'table' }, issues: [], success: true }
        : {
            issues: [`${label}: table cells must contain non-empty text.`],
            success: false,
          };
    }

    const src = block.src.trim();
    if (!src || !allowedImageSources.has(src)) {
      return {
        issues: [
          `${label}: image src must exactly match a source article image.`,
        ],
        success: false,
      };
    }

    return {
      data: {
        ...(block.alt?.trim() ? { alt: block.alt.trim() } : {}),
        ...(block.caption?.trim() ? { caption: block.caption.trim() } : {}),
        src,
        type: 'image',
      },
      issues: [],
      success: true,
    };
  }

  private mapInlineNodes(
    nodes: Array<{
      bold: boolean | null;
      italic: boolean | null;
      text: string;
      type: 'text' | 'word';
    }>,
  ): InlineNode[] {
    return nodes
      .map((node) => ({
        ...(node.bold ? { bold: true } : {}),
        ...(node.italic ? { italic: true } : {}),
        text: node.text,
        type: node.type,
      }))
      .filter(({ text }) => text.length > 0);
  }

  private mapTableCells(
    cells: Array<{ header: boolean | null; text: string }>,
  ): TableCell[] {
    return cells
      .map((cell) => ({
        ...(cell.header ? { header: true } : {}),
        text: cell.text.trim(),
      }))
      .filter(({ text }) => Boolean(text));
  }
}
