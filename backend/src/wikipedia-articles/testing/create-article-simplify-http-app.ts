import { QuizService } from '../../quiz/quiz.service';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { type Server } from 'node:http';

import { JwtService } from '../../auth/jwt.service';
import { configureApiBoundaries } from '../../common/configure-api-boundaries';
import {
  type ArticleSimplification,
  type ArticleTransformationChunk,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ArticlesController } from '../articles.controller';
import { ArticlesService } from '../articles.service';
import { type ArticleTransformationOutput } from '../contracts/ai-output.schemas';
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
import { ArticleAdaptationService } from '../transformation/article-adaptation.service';
import { ArticleContentProcessor } from '../transformation/article-content.processor';
import { ArticlePromptFactory } from '../transformation/article-prompt.factory';
import { ArticleSimplificationCache } from '../transformation/article-simplification-cache';
import { ArticleTransformationChunkCache } from '../transformation/article-transformation-chunk-cache';
import { ArticleTransformationPlanner } from '../transformation/article-transformation.planner';
import { ArticleTransformationValidator } from '../transformation/article-transformation.validator';

/**
 * Creates a simplify HTTP app with real generation orchestration and caches.
 * @returns App/server, fresh typed provider-client and persistence mocks. The
 * provider mock supplies schema-validated output or throws client errors; SDK
 * parsing has separate GroqTextClient tests. No environment variables are changed.
 * The caller must await app.close(), which also releases the token counter.
 * @example
 * const testApp = await createArticleSimplifyHttpApp();
 * testApp.provider.completeStructured.mockRejectedValue(new Error('provider failure'));
 * // POST /api/articles/simplify now returns ARTICLES_SIMPLIFICATION_FAILED.
 * await testApp.app.close();
 */
export async function createArticleSimplifyHttpApp() {
  const provider = {
    model: 'test-model',
    completeStructured: jest.fn<
      Promise<ArticleTransformationOutput>,
      [unknown]
    >(),
  };
  const prisma = {
    articleSimplification: {
      findUnique: jest
        .fn<Promise<ArticleSimplification | null>, [unknown]>()
        .mockResolvedValue(null),
      upsert: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(),
    },
    articleTransformationChunk: {
      findUnique: jest
        .fn<Promise<ArticleTransformationChunk | null>, [unknown]>()
        .mockResolvedValue(null),
      upsert: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(),
      delete: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(),
    },
  };
  const module = await Test.createTestingModule({
    controllers: [ArticlesController],
    providers: [
      {
        provide: QuizService,
        useValue: {
          create: jest
            .fn()
            .mockResolvedValue('33333333-3333-4333-8333-333333333333'),
        },
      },
      ArticlesService,
      ArticleAdaptationService,
      ArticleContentProcessor,
      ArticlePromptFactory,
      ArticleQuizPromptPlanner,
      ArticleQuizValidator,
      ArticleSimplificationCache,
      ArticleTransformationChunkCache,
      ArticleTransformationPlanner,
      ArticleTransformationValidator,
      AiRateLimitCoordinator,
      AiStructuredOutputRunner,
      AiTelemetry,
      AiTokenCounter,
      JwtService,
      { provide: GroqTextClient, useValue: provider },
      { provide: PrismaService, useValue: prisma },
      { provide: ArticleLibraryService, useValue: {} },
      { provide: ArticleQuizService, useValue: {} },
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
  return { app, server: app.getHttpServer(), provider, prisma };
}

export type ArticleSimplifyHttpTestApp = Awaited<
  ReturnType<typeof createArticleSimplifyHttpApp>
>;
