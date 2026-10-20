import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { type App } from 'supertest/types';

import { JwtService } from '../auth/jwt.service';
import { UserAuthGuard } from '../auth/user-auth.guard';
import { configureRequestValidation } from '../common/validation/configure-request-validation';
import { DictionaryController } from './dictionary.controller';
import { DictionaryService } from './dictionary.service';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const WORD_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_USER_ID = '33333333-3333-4333-8333-333333333333';
const USER = {
  id: USER_ID,
  email: 'reader@example.test',
  balance: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  lessonsCompleted: 0,
  testsCompleted: 0,
  wordsLearned: 0,
};

describe('DictionaryController authenticated routes', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let accessToken: string;
  const service = {
    findAll: jest.fn().mockResolvedValue([]),
    createWord: jest.fn().mockResolvedValue({ id: WORD_ID }),
    deleteWord: jest.fn().mockResolvedValue({ id: WORD_ID }),
    updateWordProgress: jest.fn().mockResolvedValue({ id: WORD_ID }),
    createTest: jest.fn().mockResolvedValue({ questions: [] }),
    submitTestAnswer: jest.fn().mockResolvedValue({ isCorrect: true }),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [DictionaryController],
      providers: [
        UserAuthGuard,
        JwtService,
        { provide: DictionaryService, useValue: service },
      ],
    }).compile();
    app = module.createNestApplication();
    configureRequestValidation(app);
    await app.init();
    jwtService = module.get(JwtService);
    accessToken = jwtService.issueAccessToken(USER).accessToken;
  });

  beforeEach(() => jest.clearAllMocks());
  afterAll(async () => app.close());

  it.each([
    ['get', '/words'],
    ['post', '/words'],
    ['delete', `/words/${WORD_ID}`],
    ['patch', `/words/${WORD_ID}/progress`],
    ['get', '/test'],
    ['post', '/test/answer'],
  ] as const)('rejects unauthenticated %s %s', async (method, path) => {
    await request(app.getHttpServer())
      [method](`/api/dictionary/me${path}`)
      .expect(401);
    for (const operation of Object.values(service)) {
      expect(operation).not.toHaveBeenCalled();
    }
  });

  it('rejects an invalid bearer token', async () => {
    await request(app.getHttpServer())
      .get('/api/dictionary/me/words')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
    expect(service.findAll).not.toHaveBeenCalled();
  });

  it('reads words for the token owner', async () => {
    await request(app.getHttpServer())
      .get('/api/dictionary/me/words')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200, []);
    expect(service.findAll).toHaveBeenCalledWith(USER_ID);
  });

  it('uses the new token owner when the account changes', async () => {
    const otherToken = jwtService.issueAccessToken({
      ...USER,
      id: OTHER_USER_ID,
    }).accessToken;
    await request(app.getHttpServer())
      .get('/api/dictionary/me/words')
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(200);
    expect(service.findAll).toHaveBeenCalledWith(OTHER_USER_ID);
  });

  it('creates words for the token owner', async () => {
    const body = {
      word: 'sun',
      translation: 'сонце',
      context: 'The sun rises.',
    };
    await request(app.getHttpServer())
      .post('/api/dictionary/me/words')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(body)
      .expect(201);
    expect(service.createWord).toHaveBeenCalledWith(USER_ID, body);
  });

  it('scopes deletion and progress updates to the token owner', async () => {
    await request(app.getHttpServer())
      .delete(`/api/dictionary/me/words/${WORD_ID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(service.deleteWord).toHaveBeenCalledWith(USER_ID, WORD_ID);
    await request(app.getHttpServer())
      .patch(`/api/dictionary/me/words/${WORD_ID}/progress`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ progress: 'in_progress' })
      .expect(200);
    expect(service.updateWordProgress).toHaveBeenCalledWith(USER_ID, WORD_ID, {
      progress: 'in_progress',
    });
  });

  it('creates tests and submits answers for the token owner', async () => {
    await request(app.getHttpServer())
      .get('/api/dictionary/me/test?limit=3')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(service.createTest).toHaveBeenCalledWith(USER_ID, 3);
    const answer = { wordId: WORD_ID, selectedOptionId: 'option-1' };
    await request(app.getHttpServer())
      .post('/api/dictionary/me/test/answer')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(answer)
      .expect(201);
    expect(service.submitTestAnswer).toHaveBeenCalledWith(USER_ID, answer);
  });

  it('rejects body user IDs, ignores query user IDs, and validates word IDs', async () => {
    await request(app.getHttpServer())
      .post('/api/dictionary/me/words')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        word: 'sun',
        translation: 'сонце',
        context: 'The sun rises.',
        userId: OTHER_USER_ID,
      })
      .expect(400);
    await request(app.getHttpServer())
      .get(`/api/dictionary/me/words?userId=${OTHER_USER_ID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(service.findAll).toHaveBeenCalledWith(USER_ID);
    await request(app.getHttpServer())
      .delete('/api/dictionary/me/words/not-a-uuid')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);
    expect(service.createWord).not.toHaveBeenCalled();
    expect(service.deleteWord).not.toHaveBeenCalled();
  });
});
