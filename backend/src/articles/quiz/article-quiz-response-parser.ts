import { Injectable, Logger } from '@nestjs/common';

import {
  type ArticleQuizQuestion,
  type ArticleQuizQuestionOption,
  type ArticleQuizQuestionType,
  type ArticleSimplificationLevel,
} from '../contracts/types';

@Injectable()
export class ArticleQuizResponseParser {
  private readonly logger = new Logger(ArticleQuizResponseParser.name);

  parseQuizModelResponse(rawResponse: string): ArticleQuizQuestion[] {
    if (!rawResponse) return [];

    const normalized = this.stripJsonMarkdownFences(rawResponse);
    try {
      const parsed = JSON.parse(normalized) as { questions?: unknown };
      return this.normalizeQuestions(parsed.questions);
    } catch {
      return [];
    }
  }

  stripJsonMarkdownFences(value: string): string {
    return value
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
  }

  parseJsonObject<T>(rawResponse: string): {
    diagnostics: string[];
    parsed?: T;
  } {
    const normalized = this.stripJsonMarkdownFences(rawResponse);

    try {
      return { diagnostics: [], parsed: JSON.parse(normalized) as T };
    } catch (error) {
      const diagnostics = [
        `Failed to parse AI response as JSON: ${error instanceof Error ? error.message : 'Unknown parse error'}.`,
        this.describeJsonParseError(error, normalized),
      ].filter(Boolean) as string[];
      const repaired = this.repairCommonJsonIssues(normalized);

      if (repaired !== normalized) {
        try {
          return {
            diagnostics: [
              ...diagnostics,
              'Applied JSON repair: removed trailing commas before closing brackets/braces.',
            ],
            parsed: JSON.parse(repaired) as T,
          };
        } catch (repairError) {
          const partialRecovery = this.tryRecoverFromPartialJson<T>(repaired);
          if (partialRecovery.parsed) {
            return {
              diagnostics: [
                ...diagnostics,
                `JSON repair parse still failed: ${repairError instanceof Error ? repairError.message : 'Unknown parse error'}.`,
                this.describeJsonParseError(repairError, repaired) ?? '',
                ...partialRecovery.diagnostics,
              ].filter(Boolean),
              parsed: partialRecovery.parsed,
            };
          }

          return {
            diagnostics: [
              ...diagnostics,
              `JSON repair parse still failed: ${repairError instanceof Error ? repairError.message : 'Unknown parse error'}.`,
              this.describeJsonParseError(repairError, repaired),
            ].filter(Boolean) as string[],
          };
        }
      }

      const partialRecovery = this.tryRecoverFromPartialJson<T>(normalized);
      return partialRecovery.parsed
        ? {
            diagnostics: [...diagnostics, ...partialRecovery.diagnostics],
            parsed: partialRecovery.parsed,
          }
        : { diagnostics };
    }
  }

  normalizeQuestions(rawQuestions: unknown): ArticleQuizQuestion[] {
    if (!Array.isArray(rawQuestions)) return [];

    return rawQuestions
      .map((question, index) => this.normalizeQuestion(question, index))
      .filter((question): question is ArticleQuizQuestion => question !== null);
  }

  normalizeQuestionOptions(rawOptions: unknown): ArticleQuizQuestionOption[] {
    if (!Array.isArray(rawOptions)) return [];

    return rawOptions
      .map((option, index) => {
        if (!option || typeof option !== 'object') return null;

        const candidate = option as { id?: unknown; text?: unknown };
        const text =
          typeof candidate.text === 'string' ? candidate.text.trim() : '';
        if (!text) return null;

        const id =
          typeof candidate.id === 'string' && candidate.id.trim()
            ? candidate.id.trim()
            : `o-${index + 1}`;
        return { id, text };
      })
      .filter((option): option is ArticleQuizQuestionOption => option !== null);
  }

  normalizeCorrectOptionIds(
    rawCorrectOptionIds: unknown,
    options: ArticleQuizQuestionOption[],
    type: ArticleQuizQuestionType | null,
  ): string[] {
    if (!type || !Array.isArray(rawCorrectOptionIds)) return [];

    const optionIds = new Set(options.map((option) => option.id));
    return Array.from(
      new Set(
        rawCorrectOptionIds.filter(
          (id): id is string =>
            typeof id === 'string' && id.trim().length > 0 && optionIds.has(id),
        ),
      ),
    );
  }

  truncateForLog(value: string, maxLength = 4000): string {
    return value.length > maxLength
      ? `${value.slice(0, maxLength)}... [truncated ${value.length - maxLength} chars]`
      : value;
  }

  private normalizeQuestion(
    rawQuestion: unknown,
    index: number,
  ): ArticleQuizQuestion | null {
    if (!rawQuestion || typeof rawQuestion !== 'object') return null;

    const candidate = rawQuestion as {
      correctOptionIds?: unknown;
      explanation?: unknown;
      id?: unknown;
      options?: unknown;
      prompt?: unknown;
      type?: unknown;
    };
    const prompt =
      typeof candidate.prompt === 'string' ? candidate.prompt.trim() : '';
    const type = this.normalizeQuestionType(candidate.type);
    const options = this.normalizeQuestionOptions(candidate.options);
    const correctOptionIds = this.normalizeCorrectOptionIds(
      candidate.correctOptionIds,
      options,
      type,
    );

    if (
      !prompt ||
      !type ||
      options.length < 2 ||
      correctOptionIds.length === 0
    ) {
      return null;
    }

    if (type === 'true_false') {
      const optionTexts = options.map((option) => option.text.toLowerCase());
      if (
        options.length !== 2 ||
        !optionTexts.includes('true') ||
        !optionTexts.includes('false')
      ) {
        return null;
      }
    }
    if (type === 'single_choice' && correctOptionIds.length !== 1) return null;
    if (type === 'multiple_choice' && correctOptionIds.length < 2) return null;

    const id =
      typeof candidate.id === 'string' && candidate.id.trim()
        ? candidate.id.trim()
        : `q-${index + 1}`;
    const explanation =
      typeof candidate.explanation === 'string' && candidate.explanation.trim()
        ? candidate.explanation.trim()
        : undefined;

    return { correctOptionIds, explanation, id, options, prompt, type };
  }

  private normalizeQuestionType(type: unknown): ArticleQuizQuestionType | null {
    if (
      type === 'single_choice' ||
      type === 'multiple_choice' ||
      type === 'true_false'
    ) {
      return type;
    }

    return null;
  }

  private tryRecoverFromPartialJson<T>(value: string): {
    diagnostics: string[];
    parsed?: T;
  } {
    const resolvedLevel = this.extractResolvedLevel(value);
    const questionObjects = this.extractCompleteQuestionObjects(value);
    if (questionObjects.length === 0) {
      return {
        diagnostics: [
          'Partial JSON recovery failed: no complete question objects were found.',
        ],
      };
    }

    const parsedQuestions = questionObjects.flatMap((questionObject, index) => {
      try {
        return [JSON.parse(questionObject) as Record<string, unknown>];
      } catch (error) {
        this.logger.warn(
          `Skipped partially recovered question ${index + 1}: ${error instanceof Error ? error.message : 'Unknown parse error'}`,
        );
        return [];
      }
    });
    if (parsedQuestions.length === 0) {
      return {
        diagnostics: [
          'Partial JSON recovery failed: complete question objects were found, but none parsed successfully.',
        ],
      };
    }

    return {
      diagnostics: [
        `Recovered ${parsedQuestions.length} complete question objects from truncated AI response.`,
        resolvedLevel
          ? `Recovered resolvedLevel="${resolvedLevel}" from truncated AI response.`
          : 'Could not recover resolvedLevel from truncated AI response.',
      ],
      parsed: { questions: parsedQuestions, resolvedLevel } as T,
    };
  }

  private repairCommonJsonIssues(value: string): string {
    return value.replace(/,\s*([}\]])/g, '$1').trim();
  }

  private extractResolvedLevel(
    value: string,
  ): ArticleSimplificationLevel | null {
    const match = value.match(/"resolvedLevel"\s*:\s*"(A1|A2|B1|B2|C1)"/i);
    const level = match?.[1]?.toUpperCase();
    return level && this.isSimplificationLevel(level) ? level : null;
  }

  private extractCompleteQuestionObjects(value: string): string[] {
    const questionsKeyIndex = value.indexOf('"questions"');
    const arrayStartIndex = value.indexOf('[', questionsKeyIndex);
    if (questionsKeyIndex < 0 || arrayStartIndex < 0) return [];

    const questionObjects: string[] = [];
    let inString = false;
    let isEscaped = false;
    let objectDepth = 0;
    let objectStartIndex = -1;

    for (let index = arrayStartIndex + 1; index < value.length; index += 1) {
      const character = value[index];
      if (isEscaped) {
        isEscaped = false;
        continue;
      }
      if (character === '\\') {
        isEscaped = true;
        continue;
      }
      if (character === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (character === '{') {
        if (objectDepth === 0) objectStartIndex = index;
        objectDepth += 1;
        continue;
      }
      if (character === '}') {
        if (objectDepth === 0) continue;
        objectDepth -= 1;
        if (objectDepth === 0 && objectStartIndex >= 0) {
          questionObjects.push(value.slice(objectStartIndex, index + 1));
          objectStartIndex = -1;
        }
        continue;
      }
      if (character === ']' && objectDepth === 0) break;
    }

    return questionObjects;
  }

  private describeJsonParseError(error: unknown, value: string): string | null {
    if (!(error instanceof Error)) return null;

    const positionMatch = error.message.match(/position (\d+)/i);
    const position = positionMatch ? Number(positionMatch[1]) : NaN;
    if (!Number.isFinite(position)) return null;

    const contextRadius = 120;
    const start = Math.max(0, position - contextRadius);
    const end = Math.min(value.length, position + contextRadius);
    const snippet = value
      .slice(start, end)
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n');

    return `JSON parse context around position ${position}: ${snippet}`;
  }

  private isSimplificationLevel(
    level: string,
  ): level is ArticleSimplificationLevel {
    return ['A1', 'A2', 'B1', 'B2', 'C1'].includes(level);
  }
}
