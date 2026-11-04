import request, { type Response } from 'supertest';

import {
  createQuizHttpApp,
  QUIZ_TEST_NOW,
  QUIZ_TEST_SESSION_ID,
  type QuizHttpTestApp,
} from './testing/create-quiz-http-app';
import { createQuizResponseAssertion } from './testing/create-quiz-response-assertion';

const path = `/quiz-sessions/${QUIZ_TEST_SESSION_ID}/retake`;

describe('Quiz retake and authorization OpenAPI wire contract (HTTP)', () => {
  let testApp: QuizHttpTestApp;
  let assertResponse: Awaited<ReturnType<typeof createQuizResponseAssertion>>;
  beforeAll(async () => {
    assertResponse = await createQuizResponseAssertion();
  });
  beforeEach(async () => {
    jest.useFakeTimers({
      doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'clearTimeout'],
    });
    jest.setSystemTime(new Date(QUIZ_TEST_NOW));
    testApp = await createQuizHttpApp();
  });
  afterEach(async () => {
    await testApp.app.close();
    jest.useRealTimers();
  });

  it('returns only a new session UUID with HTTP 201', async () => {
    const response = await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .expect(201)
      .expect((response: Response) => assertResponse('retakeQuiz', response));
    const body: unknown = response.body;
    if (typeof body !== 'object' || body === null) {
      throw new Error('Expected a retake response object');
    }
    expect(Object.keys(body)).toEqual(['sessionId']);
    expect(response.body).not.toHaveProperty('sessionId', QUIZ_TEST_SESSION_ID);
  });

  it('does not reveal another owner’s session when retaking', async () => {
    testApp.session.userId = '22222222-2222-4222-8222-222222222222';
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .expect(404, {
        statusCode: 404,
        code: 'QUIZ_SESSION_NOT_FOUND',
        message: 'Quiz session not found.',
      })
      .expect((response: Response) => assertResponse('retakeQuiz', response));
    expect(testApp.prisma.quizSession.create).not.toHaveBeenCalled();
  });

  it('documents a malformed session ID as DTO validation', async () => {
    const response = await request(testApp.server)
      .post('/quiz-sessions/not-a-uuid/retake')
      .set('Authorization', testApp.authorization)
      .expect(400)
      .expect((response: Response) => assertResponse('retakeQuiz', response));
    expect(response.body).toHaveProperty('code', 'VALIDATION_FAILED');
    expect(testApp.prisma.quizSession.findFirst).not.toHaveBeenCalled();
  });

  it.each([
    {
      suffix: 'answers',
      operationId: 'submitQuizAnswer',
      body: { questionId: 'q-1', selectedOptionIds: ['a'] },
    },
    { suffix: 'complete', operationId: 'completeQuiz', body: {} },
    { suffix: 'retake', operationId: 'retakeQuiz', body: {} },
  ])(
    'documents missing authentication for $operationId',
    async ({ suffix, operationId, body }) => {
      await request(testApp.server)
        .post(`/quiz-sessions/${QUIZ_TEST_SESSION_ID}/${suffix}`)
        .send(body)
        .expect(401, {
          statusCode: 401,
          code: 'AUTH_AUTHENTICATION_REQUIRED',
          message: 'Authentication is required.',
        })
        .expect((response: Response) => assertResponse(operationId, response));
      expect(testApp.prisma.quizSession.findFirst).not.toHaveBeenCalled();
    },
  );
});
