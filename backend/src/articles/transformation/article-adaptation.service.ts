import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import {
  ArticleAdaptationResponseParser,
  type SimplificationModelResponse,
} from './article-adaptation-response-parser';
import { ArticleContentProcessor } from './article-content.processor';
import { ArticlePromptFactory } from './article-prompt.factory';
import { GroqTextClient } from '../infrastructure/groq-text.client';
import { ArticleQuizResponseParser } from '../quiz/article-quiz-response-parser';
import { ArticleSimplificationCache } from './article-simplification-cache';
import {
  type ArticleBlock,
  type ArticleSimplificationLevel,
  type ArticleTextTransformationType,
  type SimplifyArticleResponse,
} from '../contracts/types';

const DEFAULT_LEVEL: ArticleSimplificationLevel = 'A2';
const DEFAULT_TRANSFORMATION_TYPE: ArticleTextTransformationType = 'summary';
const MAX_COMPLETION_TOKENS = 32_768;

type SimplifyArticleParams = {
  articleId?: number;
  blocks?: ArticleBlock[];
  level?: ArticleSimplificationLevel;
  text: string;
  title?: string;
  transformationType?: ArticleTextTransformationType;
};

type SimplificationRequest = {
  apiKey: string;
  level: ArticleSimplificationLevel;
  sourceBlocks?: ArticleBlock[];
  text: string;
  transformationType: ArticleTextTransformationType;
  title: string;
};

@Injectable()
export class ArticleAdaptationService {
  private readonly logger = new Logger(ArticleAdaptationService.name);

  constructor(
    private readonly responseParser: ArticleAdaptationResponseParser,
    private readonly contentProcessor: ArticleContentProcessor,
    private readonly groqTextClient: GroqTextClient,
    private readonly promptFactory: ArticlePromptFactory,
    private readonly quizResponseParser: ArticleQuizResponseParser,
    private readonly simplificationCache: ArticleSimplificationCache,
  ) {}

  async simplify(
    params: SimplifyArticleParams,
  ): Promise<SimplifyArticleResponse> {
    const title = params.title?.trim() || 'Untitled article';
    const text = params.text.trim();
    const level = params.level ?? DEFAULT_LEVEL;
    const transformationType =
      params.transformationType ?? DEFAULT_TRANSFORMATION_TYPE;
    const originalLength = text.length;
    const sourceBlocks =
      params.blocks && params.blocks.length > 0 ? params.blocks : undefined;
    const sourceHash = this.simplificationCache.createSourceHash({
      sourceBlocks,
      text,
      title,
    });
    const cacheKey = this.simplificationCache.createKey({
      articleId: params.articleId,
      level,
      sourceHash,
      transformationType,
      title,
    });
    const cachedResponse = await this.simplificationCache.get(cacheKey);

    if (cachedResponse) {
      this.logger.log(
        `${this.getTransformationLogLabel(transformationType)} cache hit: title="${title}", level=${level}`,
      );
      return cachedResponse;
    }

    this.logger.log(
      `${this.getTransformationLogLabel(transformationType)} cache miss: title="${title}", level=${level}, originalLength=${originalLength}`,
    );

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      this.logger.error(
        `Groq key is missing for article simplification: title="${title}"`,
      );
      throw new InternalServerErrorException(
        'Article simplification service is not configured.',
      );
    }

    try {
      this.logger.log(
        `Sending article ${transformationType} request to Groq: model=${this.groqTextClient.model}, title="${title}", level=${level}`,
      );

      const maxChunkChars =
        this.contentProcessor.getMaxTransformationChunkChars(
          transformationType,
        );
      const request: SimplificationRequest = {
        apiKey,
        level,
        sourceBlocks,
        text,
        transformationType,
        title,
      };
      const parsedResponse =
        this.contentProcessor.shouldChunkSimplificationInput({
          maxChunkChars,
          sourceBlocks,
          text,
        })
          ? await this.simplifyInChunks({ ...request, maxChunkChars })
          : await this.simplifySingleInput(request);
      const adaptedBlocks = parsedResponse.adaptedBlocks;

      if (adaptedBlocks.length === 0) {
        this.logger.error(
          `Groq returned empty ${transformationType} blocks: title="${title}", level=${level}`,
        );
        throw new BadGatewayException(
          `Article ${transformationType} is unavailable.`,
        );
      }

      const adaptedLength =
        this.contentProcessor.extractPlainTextFromArticleBlocks(
          adaptedBlocks,
        ).length;
      this.logger.log(
        `${this.getTransformationLogLabel(transformationType)} length ratio: title="${title}", level=${level}, originalLength=${originalLength}, adaptedLength=${adaptedLength}, ratio=${originalLength > 0 ? (adaptedLength / originalLength).toFixed(2) : '0'}`,
      );
      const response: SimplifyArticleResponse = {
        adaptedBlocks,
        adaptedLength,
        level,
        originalLength,
        transformationType,
        title,
        ...(parsedResponse.questions && parsedResponse.questions.length > 0
          ? { questions: parsedResponse.questions }
          : {}),
      };

      await this.simplificationCache.store({
        articleId: params.articleId,
        cacheKey,
        response,
        sourceHash,
      });
      this.logger.log(
        `${this.getTransformationLogLabel(transformationType)} stored: title="${title}", level=${level}, adaptedLength=${response.adaptedLength}`,
      );

      return response;
    } catch (error) {
      if (error instanceof BadGatewayException) {
        this.logger.error(
          `Simplification failed with gateway error: title="${title}", reason="${error.message}"`,
        );
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown Groq error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Groq request failed: title="${title}", model=${this.groqTextClient.model}, reason="${errorMessage}"`,
        errorStack,
      );

      throw new BadGatewayException('Failed to simplify article.');
    }
  }

  private async simplifySingleInput(
    params: SimplificationRequest,
  ): Promise<SimplificationModelResponse> {
    const prompt = this.promptFactory.createSimplificationPrompt({
      level: params.level,
      sourceBlocks: params.sourceBlocks,
      text: params.text,
      transformationType: params.transformationType,
      title: params.title,
    });
    const rawResponse = await this.groqTextClient.complete({
      apiKey: params.apiKey,
      maxCompletionTokens: MAX_COMPLETION_TOKENS,
      prompt,
      systemMessage:
        params.transformationType === 'adaptation'
          ? 'You rewrite English educational texts in simpler language without shortening them on purpose.'
          : 'You are helping to create educational English summaries for language learners.',
    });

    return this.responseParser.parseSimplificationModelResponse(rawResponse);
  }

  private async simplifyInChunks(
    params: SimplificationRequest & { maxChunkChars: number },
  ): Promise<SimplificationModelResponse> {
    const chunks = this.contentProcessor.createSimplificationChunks({
      maxChunkChars: params.maxChunkChars,
      sourceBlocks: params.sourceBlocks,
      text: params.text,
    });
    const adaptedChunkResponses: SimplificationModelResponse[] = [];

    this.logger.log(
      `Chunked ${params.transformationType} started: title="${params.title}", level=${params.level}, chunks=${chunks.length}, maxChunkChars=${params.maxChunkChars}`,
    );

    for (const chunk of chunks) {
      const prompt = this.promptFactory.createChunkSimplificationPrompt({
        chunk,
        level: params.level,
        sourceWordCount: this.contentProcessor.countWords(params.text),
        transformationType: params.transformationType,
        title: params.title,
      });
      const rawResponse = await this.groqTextClient.complete({
        apiKey: params.apiKey,
        maxCompletionTokens: MAX_COMPLETION_TOKENS,
        prompt,
        systemMessage:
          params.transformationType === 'adaptation'
            ? 'You rewrite one article section at a time in simpler English without intentionally shortening it.'
            : 'You summarize one article section at a time for English learners.',
      });
      const parsedResponse =
        this.responseParser.parseSimplificationModelResponse(rawResponse);

      if (parsedResponse.adaptedBlocks.length > 0) {
        const chunkAdaptedLength =
          this.contentProcessor.extractPlainTextFromArticleBlocks(
            parsedResponse.adaptedBlocks,
          ).length;
        this.logger.log(
          `Chunked ${params.transformationType} chunk completed: title="${params.title}", chunk=${chunk.index}/${chunk.total}, sourceLength=${chunk.text.length}, adaptedLength=${chunkAdaptedLength}, ratio=${chunk.text.length > 0 ? (chunkAdaptedLength / chunk.text.length).toFixed(2) : '0'}`,
        );
        adaptedChunkResponses.push(parsedResponse);
      }
    }

    const adaptedBlocks = adaptedChunkResponses.flatMap(
      (response) => response.adaptedBlocks,
    );
    const adaptedText =
      this.contentProcessor.extractPlainTextFromArticleBlocks(adaptedBlocks);

    if (adaptedBlocks.length === 0 || !adaptedText) {
      return { adaptedBlocks: [] };
    }

    if (params.transformationType === 'adaptation') {
      return { adaptedBlocks };
    }

    const quizPrompt = this.promptFactory.createQuizPrompt({
      level: params.level,
      text: adaptedText,
      title: params.title,
    });
    const quizRawResponse = await this.groqTextClient.complete({
      apiKey: params.apiKey,
      maxCompletionTokens: 1400,
      prompt: quizPrompt,
      systemMessage:
        'You are helping to create educational English quizzes for language learners.',
    });
    const questions =
      this.quizResponseParser.parseQuizModelResponse(quizRawResponse);

    return {
      adaptedBlocks,
      questions: questions.length > 0 ? questions : undefined,
    };
  }

  private getTransformationLogLabel(
    transformationType: ArticleTextTransformationType,
  ): string {
    return transformationType === 'adaptation' ? 'Adaptation' : 'Summary';
  }
}
