import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { JwtService } from '../auth/jwt.service';
import { UserAuthGuard } from '../auth/user-auth.guard';
import { configureApiBoundaries } from '../common/configure-api-boundaries';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { QuizService } from '../quiz/quiz.service';

const routes = [
  {
    method: 'get',
    path: '/api/users/me/articles/saved',
    operation: 'getSavedArticles',
    arguments: [],
    body: {},
    status: 200,
  },
  {
    method: 'post',
    path: '/api/users/me/articles/saved',
    operation: 'saveArticleForUser',
    arguments: [
      {
        id: 42,
        title: 'Space',
        extract: 'Space',
        url: 'https://example.test/42',
      },
    ],
    body: {
      id: 42,
      title: 'Space',
      extract: 'Space',
      url: 'https://example.test/42',
    },
    status: 201,
  },
  {
    method: 'delete',
    path: '/api/users/me/articles/saved/42',
    operation: 'removeSavedArticleForUser',
    arguments: [42],
    body: {},
    status: 200,
  },
  {
    method: 'get',
    path: '/api/users/me/articles/recent',
    operation: 'getRecentArticles',
    arguments: [],
    body: {},
    status: 200,
  },
  {
    method: 'post',
    path: '/api/users/me/articles/recent',
    operation: 'recordRecentArticleForUser',
    arguments: [
      {
        id: 42,
        title: 'Space',
        extract: 'Space',
        url: 'https://example.test/42',
      },
    ],
    body: {
      id: 42,
      title: 'Space',
      extract: 'Space',
      url: 'https://example.test/42',
    },
    status: 201,
  },
] as const;
const ownerIds = [
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
];
const EXPIRED_TOKEN_AGE_MS = 60 * 60 * 1000;

describe('Articles current-user contract (HTTP)', () => {
  let app: INestApplication<Server>;
  let jwt: JwtService;
  const createService = () => ({
    getSavedArticles: jest.fn().mockResolvedValue({}),
    saveArticleForUser: jest.fn().mockResolvedValue({}),
    removeSavedArticleForUser: jest.fn().mockResolvedValue({}),
    getRecentArticles: jest.fn().mockResolvedValue({}),
    recordRecentArticleForUser: jest.fn().mockResolvedValue({}),
  });
  let service: ReturnType<typeof createService>;

  beforeEach(async () => {
    service = createService();
    const module = await Test.createTestingModule({
      controllers: [ArticlesController],
      providers: [
        JwtService,
        UserAuthGuard,
        { provide: ArticlesService, useValue: service },
        { provide: QuizService, useValue: {} },
      ],
    }).compile();
    app = module.createNestApplication<INestApplication<Server>>({
      logger: false,
      bodyParser: false,
    });
    configureApiBoundaries(app);
    await app.init();
    jwt = module.get(JwtService);
  });
  afterEach(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  it.each(routes)(
    'uses the verified token owner on $method $path across accounts',
    async (route) => {
      for (const id of ownerIds) {
        const { accessToken } = jwt.issueAccessToken({
          id,
          email: 'reader@example.test',
          createdAt: '2026-10-30T00:00:00Z',
          balance: 0,
          lessonsCompleted: 0,
          testsCompleted: 0,
          wordsLearned: 0,
        });
        await request(app.getHttpServer())
          [route.method](
            route.path +
              (route.path.includes('?') ? '&' : '?') +
              'userId=untrusted-owner',
          )
          .set('Authorization', `Bearer ${accessToken}`)
          .send(route.body)
          .expect(route.status);
        expect(service[route.operation]).toHaveBeenLastCalledWith(
          id,
          ...route.arguments,
        );
      }
    },
  );

  it.each(routes)(
    'rejects invalid and expired tokens before $method $path execution',
    async (route) => {
      const clock = jest
        .spyOn(Date, 'now')
        .mockReturnValue(Date.now() - EXPIRED_TOKEN_AGE_MS);
      const { accessToken } = jwt.issueAccessToken({
        id: ownerIds[0],
        email: 'reader@example.test',
        createdAt: '2026-10-30T00:00:00Z',
        balance: 0,
        lessonsCompleted: 0,
        testsCompleted: 0,
        wordsLearned: 0,
      });
      clock.mockRestore();
      for (const token of ['invalid-token', accessToken]) {
        await request(app.getHttpServer())
          [route.method](route.path)
          .set('Authorization', `Bearer ${token}`)
          .send(route.body)
          .expect(401);
      }
      expect(service[route.operation]).not.toHaveBeenCalled();
    },
  );

  it.each(routes.filter((route) => route.method === 'post'))(
    'rejects a body-supplied owner before $method $path execution',
    async (route) => {
      const { accessToken } = jwt.issueAccessToken({
        id: ownerIds[0],
        email: 'reader@example.test',
        createdAt: '2026-10-30T00:00:00Z',
        balance: 0,
        lessonsCompleted: 0,
        testsCompleted: 0,
        wordsLearned: 0,
      });
      const response = await request(app.getHttpServer())
        [route.method](route.path)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...route.body, userId: ownerIds[1] })
        .expect(400);
      expect(response.body).toMatchObject({ code: 'VALIDATION_FAILED' });
      expect(service[route.operation]).not.toHaveBeenCalled();
    },
  );
});
