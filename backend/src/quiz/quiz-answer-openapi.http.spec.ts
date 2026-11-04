import request, { type Response } from 'supertest';

import {
  createQuizHttpApp,
  QUIZ_TEST_NOW,
  QUIZ_TEST_SESSION_ID,
  type QuizHttpTestApp,
} from './testing/create-quiz-http-app';
import { createQuizResponseAssertion } from './testing/create-quiz-response-assertion';

const path = `/quiz-sessions/${QUIZ_TEST_SESSION_ID}/answers`;
const validAnswer = { questionId: 'q-1', selectedOptionIds: ['a'] };

describe('Quiz answer OpenAPI wire contract (HTTP)', () => {
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

  it('returns required answer keys/unlocks and optional vocabulary feedback with HTTP 201', async () => {
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send(validAnswer)
      .expect(201, {
        correctOptionIds: ['a'],
        isCorrect: true,
        newlyUnlockedAchievementIds: [],
        explanation: 'The selected word means book.',
        vocabularyWord: {
          term: 'book',
          translation: 'книга',
          sourceExcerpt: 'Read a book.',
        },
      })
      .expect((response: Response) =>
        assertResponse('submitQuizAnswer', response),
      );
  });

  it('omits unavailable feedback instead of returning null', async () => {
    testApp.session.questions = [
      {
        id: 'q-1',
        type: 'single_choice',
        optionIds: ['a', 'b'],
        correctOptionIds: ['a'],
      },
    ];
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send(validAnswer)
      .expect(201, {
        correctOptionIds: ['a'],
        isCorrect: true,
        newlyUnlockedAchievementIds: [],
      })
      .expect((response: Response) =>
        assertResponse('submitQuizAnswer', response),
      );
  });

  it('returns the same documented feedback for an identical retry', async () => {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await request(testApp.server)
        .post(path)
        .set('Authorization', testApp.authorization)
        .send(validAnswer)
        .expect(201)
        .expect((response: Response) =>
          assertResponse('submitQuizAnswer', response),
        );
    }
    expect(testApp.prisma.quizAnswer.create).toHaveBeenCalledTimes(1);
  });

  it.each([
    { questionId: 'q-1', selectedOptionIds: [] },
    { questionId: 'q-1', selectedOptionIds: ['a', 'a'] },
    { questionId: 'q-1', selectedOptionIds: ['a'], percentage: 100 },
    { questionId: 'q-1' },
    { questionId: null, selectedOptionIds: ['a'] },
  ])(
    'documents invalid request structure before session reads: %j',
    async (body) => {
      const response = await request(testApp.server)
        .post(path)
        .set('Authorization', testApp.authorization)
        .send(body)
        .expect(400)
        .expect((response: Response) =>
          assertResponse('submitQuizAnswer', response),
        );
      expect(response.body).toHaveProperty('code', 'VALIDATION_FAILED');
      expect(testApp.prisma.quizSession.findFirst).not.toHaveBeenCalled();
    },
  );

  it('documents invalid question membership separately from DTO validation', async () => {
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send({ questionId: 'q-1', selectedOptionIds: ['unknown'] })
      .expect(400, {
        statusCode: 400,
        code: 'QUIZ_ANSWER_INVALID',
        message: 'Invalid question or answer selection.',
      })
      .expect((response: Response) =>
        assertResponse('submitQuizAnswer', response),
      );
  });

  it('documents a changed answer as HTTP 409', async () => {
    testApp.answers.push({
      sessionId: QUIZ_TEST_SESSION_ID,
      questionId: 'q-1',
      selectedOptionIds: ['a'],
      isCorrect: true,
      unlockedAchievementIds: [],
    });
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send({ questionId: 'q-1', selectedOptionIds: ['b'] })
      .expect(409, {
        statusCode: 409,
        code: 'QUIZ_ANSWER_ALREADY_SUBMITTED',
        message: 'This question already has a different answer.',
      })
      .expect((response: Response) =>
        assertResponse('submitQuizAnswer', response),
      );
  });

  it('documents a new answer after completion as HTTP 409', async () => {
    testApp.session.completedAt = new Date(QUIZ_TEST_NOW);
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send(validAnswer)
      .expect(409, {
        statusCode: 409,
        code: 'QUIZ_SESSION_COMPLETED',
        message: 'This quiz is already completed.',
      })
      .expect((response: Response) =>
        assertResponse('submitQuizAnswer', response),
      );
  });

  it('does not reveal another owner’s saved session', async () => {
    testApp.session.userId = '22222222-2222-4222-8222-222222222222';
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send(validAnswer)
      .expect(404, {
        statusCode: 404,
        code: 'QUIZ_SESSION_NOT_FOUND',
        message: 'Quiz session not found.',
      })
      .expect((response: Response) =>
        assertResponse('submitQuizAnswer', response),
      );
  });
});
