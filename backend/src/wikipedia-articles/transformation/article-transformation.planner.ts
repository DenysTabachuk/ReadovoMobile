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
} from './article-content.processor';
import { ArticlePromptFactory } from './article-prompt.factory';
import {
  type ArticleBlock,
  type ArticleSimplificationLevel,
  type ArticleTextTransformationType,
} from '../contracts/types';

const MIN_CHUNK_CHARS = 500;
const CHUNK_REDUCTION_SAFETY_FACTOR = 0.85;
const MAX_PLANNING_ATTEMPTS = 12;

type TransformationPlanningParams = {
  level: ArticleSimplificationLevel;
  maxCompletionTokens: number;
  schema: z.ZodType;
  sourceBlocks?: ArticleBlock[];
  sourceWordCount: number;
  systemMessage: string;
  text: string;
  title: string;
  transformationType: ArticleTextTransformationType;
};

@Injectable()
export class ArticleTransformationPlanner {
  constructor(
    private readonly contentProcessor: ArticleContentProcessor,
    private readonly promptFactory: ArticlePromptFactory,
    private readonly rateLimits: AiRateLimitCoordinator,
    private readonly tokenCounter: AiTokenCounter,
  ) {}

  isRequestWithinBudget(params: {
    maxCompletionTokens: number;
    prompt: string;
    schema: z.ZodType;
    systemMessage: string;
  }): boolean {
    return (
      this.countTotalRequestTokens(params) <=
      this.rateLimits.getMaximumRequestTokens()
    );
  }

  createTokenSafeChunks(
    params: TransformationPlanningParams,
  ): SimplificationChunk[] {
    let maxChunkChars = this.contentProcessor.getMaxTransformationChunkChars(
      params.transformationType,
    );
    let largestRequest = 0;

    for (let attempt = 0; attempt < MAX_PLANNING_ATTEMPTS; attempt += 1) {
      const chunks = this.contentProcessor.createSimplificationChunks({
        maxChunkChars,
        sourceBlocks: params.sourceBlocks,
        text: params.text,
      });
      const requestSizes = chunks.map((chunk) =>
        this.countTotalRequestTokens({
          maxCompletionTokens: params.maxCompletionTokens,
          prompt: this.promptFactory.createChunkSimplificationPrompt({
            chunk,
            level: params.level,
            sourceWordCount: params.sourceWordCount,
            title: params.title,
            transformationType: params.transformationType,
          }),
          schema: params.schema,
          systemMessage: params.systemMessage,
        }),
      );
      largestRequest = Math.max(...requestSizes, 0);
      const requestBudget = this.rateLimits.getMaximumRequestTokens();

      if (requestSizes.every((size) => size <= requestBudget)) return chunks;
      if (maxChunkChars === MIN_CHUNK_CHARS) break;

      const reductionRatio = Math.min(
        CHUNK_REDUCTION_SAFETY_FACTOR,
        (requestBudget / largestRequest) * CHUNK_REDUCTION_SAFETY_FACTOR,
      );
      maxChunkChars = Math.max(
        MIN_CHUNK_CHARS,
        Math.min(maxChunkChars - 1, Math.floor(maxChunkChars * reductionRatio)),
      );
    }

    throw new AiRequestTokenBudgetError(
      largestRequest,
      this.rateLimits.getMaximumRequestTokens(),
    );
  }

  private countTotalRequestTokens(params: {
    maxCompletionTokens: number;
    prompt: string;
    schema: z.ZodType;
    systemMessage: string;
  }): number {
    return (
      this.tokenCounter.countStructuredInput({
        prompt: params.prompt,
        schema: z.toJSONSchema(params.schema),
        systemMessage: params.systemMessage,
      }) + params.maxCompletionTokens
    );
  }
}
