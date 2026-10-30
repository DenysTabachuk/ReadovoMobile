import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { JwtService } from '../auth/jwt.service';
import { UserAuthGuard } from '../auth/user-auth.guard';
import { configureApiBoundaries } from '../common/configure-api-boundaries';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';

const routes = [
  {
    method: 'get',
    path: '/achievements/profile/me',
    operation: 'getProfile',
    arguments: [],
    body: {},
    status: 200,
  },
] as const;
const ownerIds = [
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
];
const EXPIRED_TOKEN_AGE_MS = 60 * 60 * 1000;

describe('Achievements current-user contract (HTTP)', () => {
  let app: INestApplication<Server>;
  let jwt: JwtService;
  const createService = () => ({
    getProfile: jest.fn().mockResolvedValue({}),
  });
  let service: ReturnType<typeof createService>;

  beforeEach(async () => {
    service = createService();
    const module = await Test.createTestingModule({
      controllers: [AchievementsController],
      providers: [
        JwtService,
        UserAuthGuard,
        { provide: AchievementsService, useValue: service },
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
});
