import { Injectable } from '@nestjs/common';

import { type AiQuizQuestion } from '../contracts/ai-output.schemas';
import { type SemanticValidationResult } from '../contracts/semantic-validation';
import {
  type ArticleQuizQuestion,
  type ArticleQuizQuestionOption,
  type ArticleQuizQuestionType,
} from '../contracts/types';

@Injectable()
export class ArticleQuizValidator {
  validate(
    questions: AiQuizQuestion[],
  ): SemanticValidationResult<ArticleQuizQuestion[]> {
    const issues: string[] = [];
    const validated = questions.flatMap((question, index) => {
      const result = this.validateQuestion(question, index);
      if (!result.success) {
        issues.push(...result.issues);
        return [];
      }

      return [result.data];
    });

    if (new Set(validated.map(({ id }) => id)).size !== validated.length) {
      issues.push('Question ids must be unique.');
    }

    if (issues.length > 0 || validated.length === 0) {
      return {
        issues: [
          ...issues,
          ...(validated.length === 0
            ? ['At least one semantically valid quiz question is required.']
            : []),
        ],
        success: false,
      };
    }

    return { data: validated, issues: [], success: true };
  }

  normalizeOptions(
    options: AiQuizQuestion['options'],
  ): ArticleQuizQuestionOption[] {
    return options
      .map(({ id, text }) => ({ id: id.trim(), text: text.trim() }))
      .filter(({ id, text }) => Boolean(id && text));
  }

  normalizeCorrectOptionIds(
    correctOptionIds: string[],
    options: ArticleQuizQuestionOption[],
  ): string[] {
    const optionIds = new Set(options.map(({ id }) => id));
    return Array.from(
      new Set(
        correctOptionIds
          .map((id) => id.trim())
          .filter((id) => id && optionIds.has(id)),
      ),
    );
  }

  private validateQuestion(
    question: AiQuizQuestion,
    index: number,
  ): SemanticValidationResult<ArticleQuizQuestion> {
    const label = `Question ${index + 1}`;
    const prompt = question.prompt.trim();
    const id = question.id.trim();
    const options = this.normalizeOptions(question.options);
    const correctOptionIds = this.normalizeCorrectOptionIds(
      question.correctOptionIds,
      options,
    );
    const issues = [
      ...(!id ? [`${label}: id must not be empty.`] : []),
      ...(!prompt ? [`${label}: prompt must not be empty.`] : []),
      ...(options.length < 2
        ? [`${label}: at least two non-empty options are required.`]
        : []),
      ...(new Set(options.map(({ id: optionId }) => optionId)).size !==
      options.length
        ? [`${label}: option ids must be unique.`]
        : []),
      ...(correctOptionIds.length === 0
        ? [`${label}: correctOptionIds must reference existing options.`]
        : []),
      ...this.validateQuestionType(
        question.type,
        options,
        correctOptionIds,
        label,
      ),
    ];

    if (issues.length > 0) return { issues, success: false };

    const explanation = question.explanation?.trim() || undefined;
    return {
      data: {
        correctOptionIds,
        explanation,
        id,
        options,
        prompt,
        type: question.type,
      },
      issues: [],
      success: true,
    };
  }

  private validateQuestionType(
    type: ArticleQuizQuestionType,
    options: ArticleQuizQuestionOption[],
    correctOptionIds: string[],
    label: string,
  ): string[] {
    if (type === 'single_choice' && correctOptionIds.length !== 1) {
      return [`${label}: single_choice requires exactly one correct option.`];
    }
    if (type === 'multiple_choice' && correctOptionIds.length < 2) {
      return [
        `${label}: multiple_choice requires at least two correct options.`,
      ];
    }
    if (type !== 'true_false') return [];

    const optionTexts = options.map(({ text }) => text.toLowerCase());
    return options.length === 2 &&
      optionTexts.includes('true') &&
      optionTexts.includes('false') &&
      correctOptionIds.length === 1
      ? []
      : [
          `${label}: true_false requires exactly True and False options and one correct option.`,
        ];
  }
}
