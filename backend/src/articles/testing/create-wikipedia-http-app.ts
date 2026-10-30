import { QuizService } from '../../quiz/quiz.service';
import { HttpService } from '@nestjs/axios';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { type InternalAxiosRequestConfig } from 'axios';
import { type Server } from 'node:http';

import { JwtService } from '../../auth/jwt.service';
import { configureApiBoundaries } from '../../common/configure-api-boundaries';
import { type ArticleSimplification } from '../../generated/prisma/client';
import { OutboundHttpModule } from '../../http/outbound-http.module';
import { PrismaService } from '../../prisma/prisma.service';
import { ArticlesController } from '../articles.controller';
import { ArticlesService } from '../articles.service';
import { ArticleFormulaRenderer } from '../discovery/article-formula-renderer';
import { WikipediaArticlesService } from '../discovery/wikipedia-articles.service';
import { ArticleLibraryService } from '../library/article-library.service';
import { ArticleQuizService } from '../quiz/article-quiz.service';
import { ArticleAdaptationService } from '../transformation/article-adaptation.service';

export const WIKIPEDIA_TEST_PAGE = {
  pageid: 42,
  title: 'Space',
  fullurl: 'https://en.wikipedia.org/wiki/Space',
  extract: 'Space is vast.',
  length: 1000,
};
export const WIKIPEDIA_TEST_RESPONSE = {
  query: { pages: { '42': WIKIPEDIA_TEST_PAGE } },
};

/**
 * Creates an HTTP app with real discovery, HTML parsing and Axios boundaries.
 * @returns App/server, fresh provider data mock and adaptation persistence mock.
 * Only network I/O and persistence are mocked; unused AI dependencies are stubs.
 * The caller must await app.close(). Use formula-free HTML to avoid MathJax startup.
 * @example
 * const testApp = await createWikipediaHttpApp();
 * testApp.provider.mockResolvedValueOnce({ query: { pages: {} } });
 * // GET /articles/42 now returns ARTICLES_WIKIPEDIA_ARTICLE_UNAVAILABLE.
 * await testApp.app.close();
 */
export async function createWikipediaHttpApp() {
  const provider = jest.fn<Promise<unknown>, [InternalAxiosRequestConfig]>(
    (config) =>
      Promise.resolve(
        config.responseType === 'text'
          ? '<html><body><p>Space is vast.</p></body></html>'
          : WIKIPEDIA_TEST_RESPONSE,
      ),
  );
  const prisma = {
    articleSimplification: {
      findMany: jest
        .fn<Promise<ArticleSimplification[]>, [unknown]>()
        .mockResolvedValue([]),
    },
  };
  const module = await Test.createTestingModule({
    imports: [OutboundHttpModule],
    controllers: [ArticlesController],
    providers: [
      JwtService,
      {
        provide: QuizService,
        useValue: {
          create: jest
            .fn()
            .mockResolvedValue('33333333-3333-4333-8333-333333333333'),
        },
      },
      ArticlesService,
      WikipediaArticlesService,
      ArticleFormulaRenderer,
      ArticleLibraryService,
      { provide: PrismaService, useValue: prisma },
      { provide: ArticleQuizService, useValue: {} },
      { provide: ArticleAdaptationService, useValue: {} },
    ],
  }).compile();
  module.get(HttpService).axiosRef.defaults.adapter = (config) =>
    provider(config).then((data) => ({
      config,
      data,
      headers: {},
      status: 200,
      statusText: 'OK',
    }));
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

export type WikipediaHttpTestApp = Awaited<
  ReturnType<typeof createWikipediaHttpApp>
>;
