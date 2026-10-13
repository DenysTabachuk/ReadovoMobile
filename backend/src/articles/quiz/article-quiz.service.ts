import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { GroqTextClient } from '../infrastructure/groq-text.client';
import { ArticlePromptFactory } from '../transformation/article-prompt.factory';
import { ArticleQuizResponseParser } from './article-quiz-response-parser';
import { ArticleVocabularyQuizResponseParser } from './article-vocabulary-quiz-response-parser';
import {
  type ArticleQuizQuestion,
  type ArticleSimplificationLevel,
  type ArticleSimplificationTargetLength,
  type GenerateArticleVocabularyQuizResponse,
} from '../contracts/types';

const DEFAULT_LEVEL: ArticleSimplificationLevel = 'A2';
const DEFAULT_TARGET_LENGTH: ArticleSimplificationTargetLength = 'short';
const MAX_VOCABULARY_COMPLETION_TOKENS = 5000;

@Injectable()
export class ArticleQuizService {
  private readonly logger = new Logger(ArticleQuizService.name);

  constructor(
    private readonly groqTextClient: GroqTextClient,
    private readonly promptFactory: ArticlePromptFactory,
    private readonly responseParser: ArticleQuizResponseParser,
    private readonly vocabularyResponseParser: ArticleVocabularyQuizResponseParser,
  ) {}

  async generateReadingQuiz(params: {
    level?: ArticleSimplificationLevel;
    targetLength?: ArticleSimplificationTargetLength;
    text: string;
    title?: string;
  }): Promise<ArticleQuizQuestion[]> {
    const title = params.title?.trim() || 'Untitled article';
    const text = params.text.trim();
    const level = params.level ?? DEFAULT_LEVEL;
    const targetLength = params.targetLength ?? DEFAULT_TARGET_LENGTH;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      this.logger.error(
        `Groq key is missing for article quiz: title="${title}"`,
      );
      throw new InternalServerErrorException(
        'Article quiz generation service is not configured.',
      );
    }

    const prompt = this.promptFactory.createQuizPrompt({
      level,
      targetLength,
      text,
      title,
    });

    try {
      const rawResponse = await this.groqTextClient.complete({
        apiKey,
        maxCompletionTokens: 1400,
        prompt,
        systemMessage:
          'You are helping to create educational English quizzes for language learners.',
      });
      const questions = this.responseParser.parseQuizModelResponse(rawResponse);

      if (questions.length === 0) {
        throw new BadGatewayException(
          'Article quiz generation is unavailable.',
        );
      }

      return questions;
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown Groq error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Groq quiz request failed: title="${title}", model=${this.groqTextClient.model}, reason="${errorMessage}"`,
        errorStack,
      );

      throw new BadGatewayException('Failed to generate article quiz.');
    }
  }

  async generateVocabularyQuiz(params: {
    level?: ArticleSimplificationLevel;
    text: string;
    title?: string;
  }): Promise<GenerateArticleVocabularyQuizResponse> {
    const title = params.title?.trim() || 'Untitled article';
    const text = params.text.trim();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      this.logger.error(
        `Groq key is missing for article vocabulary quiz: title="${title}"`,
      );
      throw new InternalServerErrorException(
        'Article vocabulary quiz generation service is not configured.',
      );
    }

    const targetQuestionCount =
      this.vocabularyResponseParser.getQuestionTarget(text);
    const prompt = this.promptFactory.createVocabularyQuizPrompt({
      level: params.level,
      targetQuestionCount,
      text,
      title,
    });

    try {
      const rawResponse = await this.groqTextClient.complete({
        apiKey,
        maxCompletionTokens: MAX_VOCABULARY_COMPLETION_TOKENS,
        prompt,
        systemMessage:
          'You create vocabulary quizzes from article texts for English learners.',
      });
      const parsedResponse = this.vocabularyResponseParser.parse({
        rawResponse,
        requestedLevel: params.level,
        sourceText: text,
        targetQuestionCount,
      });

      if (parsedResponse.questions.length === 0) {
        this.logger.warn(
          [
            `Vocabulary quiz generation returned no valid questions: title="${title}", requestedLevel="${params.level ?? 'auto'}", resolvedLevel="${parsedResponse.resolvedLevel}"`,
            `Diagnostics: ${parsedResponse.diagnostics.join(' | ') || 'none'}`,
            `Raw AI response: ${this.responseParser.truncateForLog(rawResponse)}`,
          ].join('\n'),
        );
        throw new BadGatewayException(
          'Article vocabulary quiz generation is unavailable.',
        );
      }

      return {
        questions: parsedResponse.questions,
        resolvedLevel: parsedResponse.resolvedLevel,
      };
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown Groq error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Groq vocabulary quiz request failed: title="${title}", model=${this.groqTextClient.model}, reason="${errorMessage}"`,
        errorStack,
      );

      throw new BadGatewayException(
        'Failed to generate article vocabulary quiz.',
      );
    }
  }
}
