import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import {
  AiRateLimitCoordinator,
  AiRequestTokenBudgetError,
} from '../infrastructure/ai-rate-limit.coordinator';
import { AiTokenCounter } from '../infrastructure/ai-token-counter';
import {
  ArticleContentProcessor,
  type SimplificationChunk,
} from '../transformation/article-content.processor';
import { type ArticleQuizSourceCoverage } from '../contracts/types';

const MAX_EXCERPT_CHARS = 1_200;

type QuizPromptInput = {
  sourceCoverage: ArticleQuizSourceCoverage;
  text: string;
};

type QuizPromptPlan = {
  prompt: string;
  sourceCoverage: ArticleQuizSourceCoverage;
  sourceText: string;
};

@Injectable()
export class ArticleQuizPromptPlanner {
  constructor(
    private readonly contentProcessor: ArticleContentProcessor,
    private readonly rateLimits: AiRateLimitCoordinator,
    private readonly tokenCounter: AiTokenCounter,
  ) {}

  createTokenSafePrompt(params: {
    createPrompt: (input: QuizPromptInput) => string;
    maxCompletionTokens: number;
    schema: z.ZodType;
    systemMessage: string;
    text: string;
  }): QuizPromptPlan {
    const fullPrompt = params.createPrompt({
      sourceCoverage: 'complete',
      text: params.text,
    });

    if (this.isWithinBudget(fullPrompt, params)) {
      return {
        prompt: fullPrompt,
        sourceCoverage: 'complete',
        sourceText: params.text,
      };
    }

    const sections = this.contentProcessor.createSimplificationChunks({
      maxChunkChars: MAX_EXCERPT_CHARS,
      text: params.text,
    });
    let low = 1;
    let high = sections.length;
    let bestPlan: QuizPromptPlan | null = null;
    let smallestRequestTokens = Number.POSITIVE_INFINITY;

    while (low <= high) {
      const sectionCount = Math.floor((low + high) / 2);
      const sourceText = this.formatRepresentativeExcerpts(
        this.selectEvenlySpacedSections(sections, sectionCount),
      );
      const prompt = params.createPrompt({
        sourceCoverage: 'representative_excerpts',
        text: sourceText,
      });
      const requestTokens = this.countRequestTokens(prompt, params);
      smallestRequestTokens = Math.min(smallestRequestTokens, requestTokens);

      if (requestTokens <= this.rateLimits.getMaximumRequestTokens()) {
        bestPlan = {
          prompt,
          sourceCoverage: 'representative_excerpts',
          sourceText,
        };
        low = sectionCount + 1;
      } else {
        high = sectionCount - 1;
      }
    }

    if (bestPlan) return bestPlan;

    throw new AiRequestTokenBudgetError(
      Number.isFinite(smallestRequestTokens)
        ? smallestRequestTokens
        : this.countRequestTokens(fullPrompt, params),
      this.rateLimits.getMaximumRequestTokens(),
    );
  }

  private isWithinBudget(
    prompt: string,
    params: {
      maxCompletionTokens: number;
      schema: z.ZodType;
      systemMessage: string;
    },
  ): boolean {
    return (
      this.countRequestTokens(prompt, params) <=
      this.rateLimits.getMaximumRequestTokens()
    );
  }

  private countRequestTokens(
    prompt: string,
    params: {
      maxCompletionTokens: number;
      schema: z.ZodType;
      systemMessage: string;
    },
  ): number {
    return (
      this.tokenCounter.countStructuredInput({
        prompt,
        schema: z.toJSONSchema(params.schema),
        systemMessage: params.systemMessage,
      }) + params.maxCompletionTokens
    );
  }

  private selectEvenlySpacedSections(
    sections: SimplificationChunk[],
    count: number,
  ): SimplificationChunk[] {
    if (count >= sections.length) return sections;
    if (count === 1) {
      return [sections[Math.floor((sections.length - 1) / 2)]].filter(
        (section): section is SimplificationChunk => Boolean(section),
      );
    }

    const indexes = Array.from({ length: count }, (_, index) =>
      Math.round((index * (sections.length - 1)) / (count - 1)),
    );

    return indexes.flatMap((index) => sections[index] ?? []);
  }

  private formatRepresentativeExcerpts(
    sections: SimplificationChunk[],
  ): string {
    return sections
      .map(
        (section, index) =>
          `[Excerpt ${index + 1} of ${sections.length}; source section ${section.index} of ${section.total}]\n${section.text}`,
      )
      .join('\n\n');
  }
}
