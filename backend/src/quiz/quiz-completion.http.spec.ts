import { Test } from '@nestjs/testing';
import { type INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import request from 'supertest';
import { JwtService } from '../auth/jwt.service';
import { configureApiBoundaries } from '../common/configure-api-boundaries';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';

const USER = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'reader@example.test',
  createdAt: '2026-01-01T00:00:00.000Z',
  balance: 0,
  testsCompleted: 0,
  wordsLearned: 0,
  lessonsCompleted: 0,
};
const SESSION_ID = '33333333-3333-4333-8333-333333333333';
const PATH = `/quiz-sessions/${SESSION_ID}/complete`;

describe('Quiz completion HTTP boundary', () => {
  let app: INestApplication<Server>;
  let authorization: string;
  const service = { complete: jest.fn(), answer: jest.fn(), retake: jest.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [QuizController],
      providers: [JwtService, { provide: QuizService, useValue: service }],
    }).compile();
    app = module.createNestApplication<INestApplication<Server>>({
      bodyParser: false,
      logger: false,
    });
    configureApiBoundaries(app);
    await app.init();
    authorization = `Bearer ${module.get(JwtService).issueAccessToken(USER).accessToken}`;
  });
  beforeEach(() => {
    jest.resetAllMocks();
    service.complete.mockResolvedValue({
      sessionId: SESSION_ID,
      replayed: false,
    });
  });
  afterAll(async () => {
    await app.close();
  });

  it('requires authentication before accepting completion', async () => {
    await request(app.getHttpServer()).post(PATH).send({}).expect(401);
    expect(service.complete).not.toHaveBeenCalled();
  });
  it('passes verified ownership and a trimmed timezone', async () => {
    await request(app.getHttpServer())
      .post(PATH)
      .set('Authorization', authorization)
      .send({ timezone: ' Europe/Paris ' })
      .expect(201);
    expect(service.complete).toHaveBeenCalledWith(
      USER.id,
      SESSION_ID,
      'Europe/Paris',
    );
  });
  it.each([{}, { timezone: null }])(
    'retains the default/stored timezone for %j',
    async (body) => {
      await request(app.getHttpServer())
        .post(PATH)
        .set('Authorization', authorization)
        .send(body)
        .expect(201);
      expect(service.complete).toHaveBeenCalledWith(
        USER.id,
        SESSION_ID,
        body.timezone,
      );
    },
  );
  it.each(['Not/A_Timezone', '', 42])(
    'rejects an invalid timezone: %s',
    async (timezone) => {
      const response = await request(app.getHttpServer())
        .post(PATH)
        .set('Authorization', authorization)
        .send({ timezone })
        .expect(400);
      expect(response.body).toMatchObject({
        code: 'VALIDATION_FAILED',
        details: { fields: [{ path: ['timezone'], rule: 'TIMEZONE_INVALID' }] },
      });
      expect(service.complete).not.toHaveBeenCalled();
    },
  );
  it.each([
    { percentage: 100 },
    { balance: 1000 },
    { userId: USER.id },
    { testsCompleted: 100 },
  ])('rejects client-owned progress %j', async (body) => {
    await request(app.getHttpServer())
      .post(PATH)
      .set('Authorization', authorization)
      .send(body)
      .expect(400);
    expect(service.complete).not.toHaveBeenCalled();
  });
  it('validates the session identifier', async () => {
    await request(app.getHttpServer())
      .post('/quiz-sessions/not-a-uuid/complete')
      .set('Authorization', authorization)
      .send({})
      .expect(400);
    expect(service.complete).not.toHaveBeenCalled();
  });
});
