import request, { type Response } from 'supertest';

import { exportOpenApi } from '../openapi/export-openapi';
import {
  createQuizHttpApp,
  QUIZ_TEST_NOW,
  QUIZ_TEST_SESSION_ID,
  type QuizHttpTestApp,
} from './testing/create-quiz-http-app';
import { createQuizResponseAssertion } from './testing/create-quiz-response-assertion';

const path = `/quiz-sessions/${QUIZ_TEST_SESSION_ID}/complete`;

describe('Quiz completion OpenAPI wire contract (HTTP)', () => {
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
    testApp.answers.push({
      sessionId: QUIZ_TEST_SESSION_ID,
      questionId: 'q-1',
      selectedOptionIds: ['a'],
      isCorrect: true,
      unlockedAchievementIds: [],
    });
  });
  afterEach(async () => {
    await testApp.app.close();
    jest.useRealTimers();
  });

  it('composes real achievement/streak profiles with immutable completion totals', async () => {
    const response = await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send({ timezone: ' Europe/Paris ' })
      .expect(201)
      .expect((response: Response) => assertResponse('completeQuiz', response));
    expect(response.body).toMatchObject({
      sessionId: QUIZ_TEST_SESSION_ID,
      replayed: false,
      completion: {
        correctAnswers: 1,
        totalQuestions: 1,
        percentage: 100,
        rewards: {
          quizCoins: 42,
          achievementCoins: 0,
          streakCoins: 0,
          totalCoins: 42,
        },
        newlyUnlockedAchievementIds: [],
        newlyUnlockedStreakMilestones: [],
        shouldShowStreakBanner: false,
      },
      profile: { progress: { balance: 142, testsCompleted: 2 } },
      streak: {
        coinBalance: 142,
        serverNow: QUIZ_TEST_NOW,
        todayStatus: 'completed',
        lastActivityDate: '2026-10-28',
        brokenStreakInfo: null,
      },
    });
    expect(response.body).toHaveProperty(
      'profile.achievements.0.claimedAt',
      QUIZ_TEST_NOW,
    );
  });

  it.each([{}, { timezone: null }])(
    'accepts absent/null timezone fields: %j',
    async (body) => {
      await request(testApp.server)
        .post(path)
        .set('Authorization', testApp.authorization)
        .send(body)
        .expect(201)
        .expect((response: Response) =>
          assertResponse('completeQuiz', response),
        );
    },
  );

  it('accepts an omitted request body as documented', async () => {
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .expect(201)
      .expect((response: Response) => assertResponse('completeQuiz', response));
  });

  it('returns HTTP 201 and replayed=true without crediting again on a retry', async () => {
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send({})
      .expect(201)
      .expect((response: Response) => assertResponse('completeQuiz', response));
    const response = await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send({})
      .expect(201)
      .expect((response: Response) => assertResponse('completeQuiz', response));
    expect(response.body).toHaveProperty('replayed', true);
    expect(response.body).toHaveProperty('completion.rewards.totalCoins', 42);
    expect(response.body).toHaveProperty('profile.progress.balance', 142);
    expect(testApp.prisma.user.update).toHaveBeenCalledTimes(1);
  });

  it('preserves historical integer milestones accepted by the persistence decoder', async () => {
    testApp.session.completedAt = new Date(QUIZ_TEST_NOW);
    testApp.session.completion = {
      correctAnswers: 1,
      totalQuestions: 1,
      percentage: 100,
      rewards: {
        quizCoins: 42,
        achievementCoins: 0,
        streakCoins: 0,
        totalCoins: 42,
      },
      newlyUnlockedAchievementIds: [],
      newlyUnlockedStreakMilestones: [365],
      shouldShowStreakBanner: false,
    };
    const response = await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send({})
      .expect(201)
      .expect((response: Response) => assertResponse('completeQuiz', response));
    expect(response.body).toHaveProperty(
      'completion.newlyUnlockedStreakMilestones',
      [365],
    );
    expect(response.body).toHaveProperty('profile.progress.balance', 100);
  });

  it('documents an incomplete session with HTTP 409', async () => {
    testApp.answers.length = 0;
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send({})
      .expect(409, {
        statusCode: 409,
        code: 'QUIZ_SESSION_INCOMPLETE',
        message: 'Answer all questions before completing the quiz.',
      })
      .expect((response: Response) => assertResponse('completeQuiz', response));
  });

  it.each([{ timezone: 'Invalid/Timezone' }, { percentage: 100 }])(
    'documents rejected completion bodies before persistence: %j',
    async (body) => {
      const response = await request(testApp.server)
        .post(path)
        .set('Authorization', testApp.authorization)
        .send(body)
        .expect(400)
        .expect((response: Response) =>
          assertResponse('completeQuiz', response),
        );
      expect(response.body).toHaveProperty('code', 'VALIDATION_FAILED');
      expect(testApp.prisma.quizSession.findFirst).not.toHaveBeenCalled();
    },
  );

  it('retains the runtime decoder for malformed saved completions', async () => {
    testApp.session.completedAt = new Date(QUIZ_TEST_NOW);
    testApp.session.completion = { secret: 'invalid persisted completion' };
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send({})
      .expect(500, {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error.',
      })
      .expect((response: Response) => assertResponse('completeQuiz', response));
  });

  it('describes the optional body, UUID parameter and reused public profile schemas', async () => {
    const document = await exportOpenApi();
    const operation =
      document.paths['/quiz-sessions/{sessionId}/complete']?.post;
    expect(operation).toMatchObject({
      security: [{ bearer: [] }],
      requestBody: { required: false },
    });
    expect(operation?.parameters).toMatchObject([
      {
        name: 'sessionId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ]);
    expect(document.components?.schemas).toMatchObject({
      CompleteQuizRequest: {
        additionalProperties: false,
        properties: { timezone: { type: 'string', nullable: true } },
      },
      QuizCompletionResponse: {
        required: ['sessionId', 'replayed', 'completion', 'profile', 'streak'],
        properties: {
          profile: { $ref: '#/components/schemas/AchievementsProfileResponse' },
          streak: { $ref: '#/components/schemas/StreakState' },
        },
      },
      SubmitQuizAnswerRequest: {
        additionalProperties: false,
        required: ['questionId', 'selectedOptionIds'],
        properties: {
          questionId: { type: 'string', maxLength: 200 },
          selectedOptionIds: {
            type: 'array',
            minItems: 1,
            maxItems: 20,
            uniqueItems: true,
            items: { type: 'string', maxLength: 200 },
          },
        },
      },
    });
  });
});
