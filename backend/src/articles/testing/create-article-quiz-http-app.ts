import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { type Server } from 'node:http';

import { JwtService } from '../../auth/jwt.service';
import { configureApiBoundaries } from '../../common/configure-api-boundaries';
import { ArticlesController } from '../articles.controller';
import { ArticlesService } from '../articles.service';
import {
  type ReadingQuizOutput,
  type VocabularyQuizOutput,
} from '../contracts/ai-output.schemas';
import { WikipediaArticlesService } from '../discovery/wikipedia-articles.service';
import { AiRateLimitCoordinator } from '../infrastructure/ai-rate-limit.coordinator';
import { AiStructuredOutputRunner } from '../infrastructure/ai-structured-output.runner';
import { AiTelemetry } from '../infrastructure/ai.telemetry';
import { AiTokenCounter } from '../infrastructure/ai-token-counter';
import { GroqTextClient } from '../infrastructure/groq-text.client';
import { ArticleLibraryService } from '../library/article-library.service';
import { ArticleQuizPromptPlanner } from '../quiz/article-quiz-prompt.planner';
import { ArticleQuizService } from '../quiz/article-quiz.service';
import { ArticleQuizValidator } from '../quiz/article-quiz.validator';
import { ArticleVocabularyQuizValidator } from '../quiz/article-vocabulary-quiz.validator';
import { ArticleAdaptationService } from '../transformation/article-adaptation.service';
import { ArticleContentProcessor } from '../transformation/article-content.processor';
import { ArticlePromptFactory } from '../transformation/article-prompt.factory';

type QuizOutput = ReadingQuizOutput | VocabularyQuizOutput;

/**
 * Creates a quiz HTTP app with real planning, retry orchestration and validators.
 * @returns App/server and a fresh typed provider-client mock for the selected
 * quiz output. The mock supplies schema-validated output/client failures; SDK
 * parsing has its own tests. Unused domain dependencies are stubs, with no DB or
 * external requests. No globals change. The caller must await app.close().
 * @example
 * const testApp = await createArticleQuizHttpApp<ReadingQuizOutput>();
 * testApp.provider.completeStructured.mockResolvedValue({ questions: [] });
 * // Reading quiz retries semantic validation, then returns ARTICLES_QUIZ_GENERATION_FAILED.
 * await testApp.app.close();
 */
export async function createArticleQuizHttpApp<TOutput extends QuizOutput>() {
  const provider = {
    model: 'test-model',
    completeStructured: jest.fn<Promise<TOutput>, [unknown]>(),
  };
  const module = await Test.createTestingModule({
    controllers: [ArticlesController],
    providers: [
      ArticlesService,
      ArticleQuizService,
      ArticleQuizPromptPlanner,
      ArticleQuizValidator,
      ArticleVocabularyQuizValidator,
      ArticleContentProcessor,
      ArticlePromptFactory,
      AiRateLimitCoordinator,
      AiStructuredOutputRunner,
      AiTelemetry,
      AiTokenCounter,
      JwtService,
      { provide: GroqTextClient, useValue: provider },
      { provide: ArticleLibraryService, useValue: {} },
      { provide: ArticleAdaptationService, useValue: {} },
      { provide: WikipediaArticlesService, useValue: {} },
    ],
  }).compile();
  const app = module.createNestApplication<INestApplication<Server>>({
    bodyParser: false,
    logger: false,
  });
  configureApiBoundaries(app);
  try {
    await app.init();
  } catch (error) {
    await app.close();
    throw error;
  }
  return { app, server: app.getHttpServer(), provider };
}

export type ArticleQuizHttpTestApp<TOutput extends QuizOutput> = Awaited<
  ReturnType<typeof createArticleQuizHttpApp<TOutput>>
>;
