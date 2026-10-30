import { QuizService } from '../../quiz/quiz.service';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { type Server } from 'node:http';

import { JwtService } from '../../auth/jwt.service';
import { UserAuthGuard } from '../../auth/user-auth.guard';
import { configureApiBoundaries } from '../../common/configure-api-boundaries';
import {
  type ArticleSimplification,
  type UserRecentArticle,
  type UserSavedArticle,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ArticlesController } from '../articles.controller';
import { ArticlesService } from '../articles.service';
import { WikipediaArticlesService } from '../discovery/wikipedia-articles.service';
import { ArticleLibraryService } from '../library/article-library.service';
import { ArticleQuizService } from '../quiz/article-quiz.service';
import { ArticleAdaptationService } from '../transformation/article-adaptation.service';

export const LIBRARY_TEST_USER_ID = '11111111-1111-4111-8111-111111111111';
export const LIBRARY_TEST_ARTICLE = {
  id: 42,
  extract: 'An article about space.',
  title: 'Space',
  url: 'https://en.wikipedia.org/wiki/Space',
};

/**
 * Creates a library HTTP app with real facade, library service, DTOs and guards.
 * @returns App/server, owner authorization and fresh persistence mocks. Unused
 * discovery/AI dependencies are empty stubs; no external services are started.
 * The caller owns the lifecycle and must await app.close().
 * @example
 * const testApp = await createArticleLibraryHttpApp();
 * testApp.prisma.user.findUnique.mockResolvedValue(null);
 * // Library requests now return ARTICLES_USER_NOT_FOUND.
 * await testApp.app.close();
 */
export async function createArticleLibraryHttpApp() {
  const prisma = {
    user: {
      findUnique: jest
        .fn<Promise<{ id: string } | null>, [unknown]>()
        .mockResolvedValue({ id: LIBRARY_TEST_USER_ID }),
    },
    userSavedArticle: {
      findMany: jest
        .fn<Promise<UserSavedArticle[]>, [unknown]>()
        .mockResolvedValue([]),
      upsert: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(),
      deleteMany: jest
        .fn<Promise<{ count: number }>, [unknown]>()
        .mockResolvedValue({ count: 0 }),
    },
    userRecentArticle: {
      findMany: jest
        .fn<Promise<UserRecentArticle[]>, [unknown]>()
        .mockResolvedValue([]),
      upsert: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(),
      deleteMany: jest
        .fn<Promise<{ count: number }>, [unknown]>()
        .mockResolvedValue({ count: 0 }),
    },
    articleSimplification: {
      findMany: jest
        .fn<Promise<ArticleSimplification[]>, [unknown]>()
        .mockResolvedValue([]),
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
      ArticleLibraryService,
      JwtService,
      UserAuthGuard,
      { provide: PrismaService, useValue: prisma },
      { provide: WikipediaArticlesService, useValue: {} },
      { provide: ArticleQuizService, useValue: {} },
      { provide: ArticleAdaptationService, useValue: {} },
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
  const token = module.get(JwtService).issueAccessToken({
    id: LIBRARY_TEST_USER_ID,
    email: 'reader@example.test',
    createdAt: '2026-10-28T12:00:00.000Z',
    balance: 0,
    lessonsCompleted: 0,
    testsCompleted: 0,
    wordsLearned: 0,
  }).accessToken;
  return {
    app,
    server: app.getHttpServer(),
    prisma,
    authorization: `Bearer ${token}`,
  };
}

export type ArticleLibraryHttpTestApp = Awaited<
  ReturnType<typeof createArticleLibraryHttpApp>
>;
