import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import request from 'supertest';
import { z } from 'zod';
import { JwtService } from '../src/auth/jwt.service';
import { configureApiBoundaries } from '../src/common/configure-api-boundaries';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { QuizModule } from '../src/quiz/quiz.module';
import { QuizService } from '../src/quiz/quiz.service';
import { StreakService } from '../src/streak/streak.service';
import { randomizeQuizOptions } from '../src/articles/quiz/utils/randomizeQuizOptions';

// Opt in with a dedicated database; never run destructive fixture cleanup on the app DB.
const databaseUrl = process.env.QUIZ_TEST_DATABASE_URL;
const databaseDescribe = databaseUrl ? describe : describe.skip;
const resultSchema = z.object({
  replayed: z.boolean(),
  completion: z.unknown(),
  profile: z.object({ progress: z.object({ balance: z.number() }) }),
});

databaseDescribe('Quiz rewards with real PostgreSQL transactions', () => {
  let app: INestApplication<Server>;
  let prisma: PrismaService;
  let quiz: QuizService;
  let userId: string;
  let authorization: string;
  let previousDatabaseUrl: string | undefined;
  const questions = [
    {
      id: 'q-1',
      type: 'single_choice' as const,
      optionIds: ['a', 'b'],
      correctOptionIds: ['a'],
    },
  ];

  beforeAll(async () => {
    if (!databaseUrl || new URL(databaseUrl).pathname !== '/readovo_quiz_test')
      throw new Error('Use the dedicated readovo_quiz_test database.');
    previousDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = databaseUrl;
    const module = await Test.createTestingModule({
      imports: [PrismaModule, QuizModule],
    }).compile();
    app = module.createNestApplication<INestApplication<Server>>({
      bodyParser: false,
      logger: false,
    });
    configureApiBoundaries(app);
    await app.init();
    prisma = module.get(PrismaService);
    quiz = module.get(QuizService);
  });

  beforeEach(async () => {
    userId = randomUUID();
    const user = await prisma.user.create({
      data: {
        id: userId,
        email: `${userId}@example.test`,
        passwordHash: 'unused',
        passwordSalt: 'unused',
      },
    });
    authorization = `Bearer ${app.get(JwtService).issueAccessToken({ ...user, createdAt: user.createdAt.toISOString() }).accessToken}`;
  });

  afterEach(async () => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  afterAll(async () => {
    await app.close();
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabaseUrl;
  });

  /**
   * Saves and answers one fixture session using the authenticated HTTP boundary.
   * @returns The persisted session ID; no rewards have been granted yet.
   * @example const id = await createAnsweredSession(); // An answer exists for id.
   */
  async function createAnsweredSession() {
    const sessionId = await quiz.create(userId, {
      kind: 'dictionary',
      questions,
    });
    await request(app.getHttpServer())
      .post(`/quiz-sessions/${sessionId}/answers`)
      .set('Authorization', authorization)
      .send({ questionId: 'q-1', selectedOptionIds: ['a'] })
      .expect(201);
    return sessionId;
  }

  it('awards one completion once even when two completion requests race', async () => {
    const sessionId = await createAnsweredSession();
    const results = await Promise.all(
      [1, 2].map(() =>
        request(app.getHttpServer())
          .post(`/quiz-sessions/${sessionId}/complete`)
          .set('Authorization', authorization)
          .send({ timezone: 'UTC' })
          .expect(201),
      ),
    );

    const bodies = results.map((result) => resultSchema.parse(result.body));
    expect(bodies.map((body) => body.replayed).sort()).toEqual([false, true]);
    expect(bodies[0].completion).toEqual(bodies[1].completion);
    expect(
      await prisma.user.findUnique({ where: { id: userId } }),
    ).toMatchObject({ balance: 102, testsCompleted: 1 });
    expect(await prisma.userAchievement.count({ where: { userId } })).toBe(1);
    expect(
      await prisma.userStreakProfile.findUnique({ where: { userId } }),
    ).toMatchObject({ currentStreak: 1 });
  });

  it('grants the first-test bonus once across different sessions and preserves spending', async () => {
    await prisma.user.update({ where: { id: userId }, data: { balance: 200 } });
    const first = await createAnsweredSession();
    const second = await createAnsweredSession();
    await Promise.all([
      request(app.getHttpServer())
        .post(`/quiz-sessions/${first}/complete`)
        .set('Authorization', authorization)
        .send({})
        .expect(201),
      request(app.getHttpServer())
        .post(`/quiz-sessions/${second}/complete`)
        .set('Authorization', authorization)
        .send({})
        .expect(201),
      prisma.user.update({
        where: { id: userId },
        data: { balance: { decrement: 20 } },
      }),
    ]);

    expect(
      await prisma.user.findUnique({ where: { id: userId } }),
    ).toMatchObject({ balance: 324, testsCompleted: 2 });
    expect(
      await prisma.userStreakProfile.findUnique({ where: { userId } }),
    ).toMatchObject({ currentStreak: 1 });
  });

  it('rolls back rewards, progress, and completion when streak recording fails', async () => {
    const sessionId = await createAnsweredSession();
    jest
      .spyOn(app.get(StreakService), 'recordQuizCompletion')
      .mockRejectedValueOnce(new Error('Injected transaction failure'));
    await request(app.getHttpServer())
      .post(`/quiz-sessions/${sessionId}/complete`)
      .set('Authorization', authorization)
      .send({})
      .expect(500);

    expect(
      await prisma.user.findUnique({ where: { id: userId } }),
    ).toMatchObject({ balance: 0, testsCompleted: 0 });
    expect(
      await prisma.quizSession.findUnique({ where: { id: sessionId } }),
    ).toMatchObject({ completedAt: null, completion: null });
    expect(await prisma.userAchievement.count({ where: { userId } })).toBe(0);
  });

  it('returns the immutable reward with fresh account state on replay', async () => {
    const sessionId = await createAnsweredSession();
    const first = await request(app.getHttpServer())
      .post(`/quiz-sessions/${sessionId}/complete`)
      .set('Authorization', authorization)
      .send({})
      .expect(201);
    await prisma.user.update({
      where: { id: userId },
      data: { balance: { decrement: 5 } },
    });
    const replay = await request(app.getHttpServer())
      .post(`/quiz-sessions/${sessionId}/complete`)
      .set('Authorization', authorization)
      .send({})
      .expect(201);

    const replayResult = resultSchema.parse(replay.body);
    expect(replayResult.replayed).toBe(true);
    expect(replayResult.completion).toEqual(
      resultSchema.parse(first.body).completion,
    );
    expect(replayResult.profile.progress.balance).toBe(97);
  });

  it('applies a dictionary answer once and rejects an altered retry', async () => {
    const wordId = randomUUID();
    await prisma.dictionaryWord.create({
      data: {
        id: wordId,
        userId,
        word: 'sun',
        normalizedWord: 'sun',
        translation: 'sun translation',
        context: '',
        correctAnswersCount: 4,
        progress: 'in_progress',
      },
    });
    const sessionId = await quiz.create(userId, {
      kind: 'dictionary',
      questions: [{ ...questions[0], wordId }],
    });
    const path = `/quiz-sessions/${sessionId}/answers`;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await request(app.getHttpServer())
        .post(path)
        .set('Authorization', authorization)
        .send({ questionId: 'q-1', selectedOptionIds: ['a'] })
        .expect(201);
    }
    await request(app.getHttpServer())
      .post(path)
      .set('Authorization', authorization)
      .send({ questionId: 'q-1', selectedOptionIds: ['b'] })
      .expect(409);

    expect(
      await prisma.dictionaryWord.findUnique({ where: { id: wordId } }),
    ).toMatchObject({ correctAnswersCount: 5, progress: 'learned' });
    expect(await prisma.quizAnswer.count({ where: { sessionId } })).toBe(1);
    await request(app.getHttpServer())
      .post(`/quiz-sessions/${sessionId}/complete`)
      .set('Authorization', authorization)
      .send({})
      .expect(201);
    expect(
      await prisma.dictionaryWord.findUnique({ where: { id: wordId } }),
    ).toMatchObject({ correctAnswersCount: 5 });
  });

  it('rejects incomplete sessions, invalid selections, and client-owned reward fields', async () => {
    const sessionId = await quiz.create(userId, {
      kind: 'article',
      level: 'A2',
      targetLength: 'medium',
      questions,
    });
    await request(app.getHttpServer())
      .post(`/quiz-sessions/${sessionId}/complete`)
      .set('Authorization', authorization)
      .send({})
      .expect(409);
    for (const selectedOptionIds of [['unknown'], ['a', 'a'], ['a', 'b'], []]) {
      await request(app.getHttpServer())
        .post(`/quiz-sessions/${sessionId}/answers`)
        .set('Authorization', authorization)
        .send({ questionId: 'q-1', selectedOptionIds })
        .expect(400);
    }
    await request(app.getHttpServer())
      .post(`/quiz-sessions/${sessionId}/complete`)
      .set('Authorization', authorization)
      .send({ balance: 10000, percentage: 100, testsCompleted: 100 })
      .expect(400);
    expect(
      await prisma.user.findUnique({ where: { id: userId } }),
    ).toMatchObject({ balance: 0, testsCompleted: 0 });
  });

  it('requires authentication and rejects another owner without revealing their session', async () => {
    const sessionId = await createAnsweredSession();
    await request(app.getHttpServer())
      .post(`/quiz-sessions/${sessionId}/complete`)
      .send({})
      .expect(401);
    const foreign = `Bearer ${app.get(JwtService).issueAccessToken({ id: randomUUID(), email: 'other@example.test', createdAt: new Date().toISOString(), balance: 0, testsCompleted: 0, lessonsCompleted: 0, wordsLearned: 0 }).accessToken}`;
    await request(app.getHttpServer())
      .post(`/quiz-sessions/${sessionId}/complete`)
      .set('Authorization', foreign)
      .send({})
      .expect(404);
    expect(
      await prisma.user.findUnique({ where: { id: userId } }),
    ).toMatchObject({ balance: 0, testsCompleted: 0 });
  });

  it('makes achievement reads read-only and closes arbitrary progress and streak writes', async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { testsCompleted: 1, balance: 1000 },
    });
    await request(app.getHttpServer())
      .get('/achievements/profile/me')
      .set('Authorization', authorization)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/achievements/profile/${userId}/progress`)
      .set('Authorization', authorization)
      .send({ balance: 999999 })
      .expect(404);
    await request(app.getHttpServer())
      .post('/streak/profile/me/activity-completed')
      .set('Authorization', authorization)
      .send({ activityType: 'article_quiz_completed' })
      .expect(404);
    expect(await prisma.userAchievement.count({ where: { userId } })).toBe(0);
    expect(
      await prisma.user.findUnique({ where: { id: userId } }),
    ).toMatchObject({ balance: 1000, testsCompleted: 1 });
  });

  it('grades multiple choice by exact membership and preserves the first attempt', async () => {
    const sessionId = await quiz.create(userId, {
      kind: 'article',
      questions: [
        {
          id: 'partial',
          type: 'multiple_choice',
          optionIds: ['a', 'b', 'c'],
          correctOptionIds: ['a', 'b'],
        },
        {
          id: 'exact',
          type: 'multiple_choice',
          optionIds: ['a', 'b', 'c'],
          correctOptionIds: ['a', 'b'],
        },
      ],
    });
    await request(app.getHttpServer())
      .post(`/quiz-sessions/${sessionId}/answers`)
      .set('Authorization', authorization)
      .send({ questionId: 'partial', selectedOptionIds: ['a'] })
      .expect(201)
      .expect(({ body }: { body: unknown }) =>
        expect(body).toMatchObject({ isCorrect: false }),
      );
    await request(app.getHttpServer())
      .post(`/quiz-sessions/${sessionId}/answers`)
      .set('Authorization', authorization)
      .send({ questionId: 'exact', selectedOptionIds: ['b', 'a'] })
      .expect(201)
      .expect(({ body }: { body: unknown }) =>
        expect(body).toMatchObject({ isCorrect: true }),
      );
    await request(app.getHttpServer())
      .post(`/quiz-sessions/${sessionId}/answers`)
      .set('Authorization', authorization)
      .send({ questionId: 'partial', selectedOptionIds: ['a', 'b'] })
      .expect(409);
    const result = await quiz.complete(userId, sessionId);
    expect(result.completion).toMatchObject({
      correctAnswers: 1,
      totalQuestions: 2,
      percentage: 50,
      rewards: { quizCoins: 26 },
    });
  });

  it('awards cascades and existing eligibility during a verified write, never a read', async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { balance: 900, testsCompleted: 9 },
    });
    const sessionId = await createAnsweredSession();
    const result = await quiz.complete(userId, sessionId);
    expect(result.completion.rewards).toEqual({
      quizCoins: 42,
      achievementCoins: 350,
      streakCoins: 0,
      totalCoins: 392,
    });
    expect(result.completion.newlyUnlockedAchievementIds.sort()).toEqual([
      'first_test_completed',
      'first_thousand_coins',
      'ten_tests_completed',
    ]);
    expect(result.profile.progress).toMatchObject({
      balance: 1292,
      testsCompleted: 10,
    });
    await quiz.complete(userId, sessionId);
    expect(await prisma.userAchievement.count({ where: { userId } })).toBe(3);
  });

  it('commits learned-word achievement rewards with the answer and reports them at completion', async () => {
    await prisma.dictionaryWord.createMany({
      data: Array.from({ length: 10 }, (_, index) => ({
        id: randomUUID(),
        userId,
        word: `word-${index}`,
        normalizedWord: `word-${index}`,
        translation: 'translation',
        context: '',
        progress: index === 9 ? 'in_progress' : 'learned',
        correctAnswersCount: index === 9 ? 4 : 5,
      })),
    });
    const word = await prisma.dictionaryWord.findFirstOrThrow({
      where: { userId, progress: 'in_progress' },
    });
    const sessionId = await quiz.create(userId, {
      kind: 'dictionary',
      questions: [{ ...questions[0], wordId: word.id }],
    });
    const answer = await quiz.answer(userId, sessionId, {
      questionId: 'q-1',
      selectedOptionIds: ['a'],
    });
    expect(answer.newlyUnlockedAchievementIds).toEqual(['ten_words_learned']);
    expect(
      await prisma.user.findUnique({ where: { id: userId } }),
    ).toMatchObject({ balance: 100 });
    const result = await quiz.complete(userId, sessionId);
    expect(result.completion.rewards).toMatchObject({
      quizCoins: 52,
      achievementCoins: 150,
      totalCoins: 202,
    });
    expect(result.profile.progress).toMatchObject({
      balance: 202,
      wordsLearned: 10,
    });
    await quiz.answer(userId, sessionId, {
      questionId: 'q-1',
      selectedOptionIds: ['a'],
    });
    expect(
      await prisma.user.findUnique({ where: { id: userId } }),
    ).toMatchObject({ balance: 202 });
  });

  it('gives a retake a new owned session without copying answers or awards', async () => {
    const originalId = await createAnsweredSession();
    await quiz.complete(userId, originalId);
    const response = await request(app.getHttpServer())
      .post(`/quiz-sessions/${originalId}/retake`)
      .set('Authorization', authorization)
      .expect(201);
    const { sessionId } = z
      .object({ sessionId: z.string().uuid() })
      .parse(response.body);
    expect(sessionId).not.toBe(originalId);
    expect(await prisma.quizAnswer.count({ where: { sessionId } })).toBe(0);
    await request(app.getHttpServer())
      .post(`/quiz-sessions/${sessionId}/complete`)
      .set('Authorization', authorization)
      .send({})
      .expect(409);
    await quiz.answer(userId, sessionId, {
      questionId: 'q-1',
      selectedOptionIds: ['a'],
    });
    const result = await quiz.complete(userId, sessionId);
    expect(result.completion.rewards.quizCoins).toBe(42);
    expect(result.profile.progress).toMatchObject({
      balance: 144,
      testsCompleted: 2,
    });
  });

  it('grades opaque vocabulary IDs and reveals word details only after the first attempt is locked', async () => {
    const question = randomizeQuizOptions({
      id: 'vq-1',
      type: 'single_choice' as const,
      prompt: 'Translate forest.',
      options: [
        { id: 'vq-1:correct', text: 'ліс' },
        { id: 'vq-1:distractor:1', text: 'гора' },
      ],
      correctOptionIds: ['vq-1:correct'],
    });
    const vocabularyWord = {
      term: 'forest',
      translation: 'ліс',
      sourceExcerpt: 'The forest protects animals.',
    };
    const sessionId = await quiz.create(userId, {
      kind: 'vocabulary',
      level: 'A2',
      targetLength: 'medium',
      questions: [
        {
          id: question.id,
          type: question.type,
          optionIds: question.options.map((option) => option.id),
          correctOptionIds: question.correctOptionIds,
          vocabularyWord,
        },
      ],
    });
    const answerPath = `/quiz-sessions/${sessionId}/answers`;
    const invalid = await request(app.getHttpServer())
      .post(answerPath)
      .set('Authorization', authorization)
      .send({ questionId: question.id, selectedOptionIds: ['vq-1:correct'] })
      .expect(400);
    expect(invalid.body).not.toHaveProperty('vocabularyWord');

    const wrongOption = question.options.find(
      (option) => option.text === 'гора',
    );
    if (!wrongOption) throw new Error('Expected a distractor.');
    const answer = await request(app.getHttpServer())
      .post(answerPath)
      .set('Authorization', authorization)
      .send({ questionId: question.id, selectedOptionIds: [wrongOption.id] })
      .expect(201);
    expect(answer.body).toMatchObject({
      isCorrect: false,
      correctOptionIds: question.correctOptionIds,
      vocabularyWord,
    });
    await request(app.getHttpServer())
      .post(answerPath)
      .set('Authorization', authorization)
      .send({
        questionId: question.id,
        selectedOptionIds: question.correctOptionIds,
      })
      .expect(409);

    const completion = await quiz.complete(userId, sessionId);
    expect(completion.completion).toMatchObject({
      correctAnswers: 0,
      percentage: 0,
    });
  });

  it('validates completion timezone before writes and preserves the stored zone when omitted', async () => {
    const sessionId = await createAnsweredSession();
    for (const timezone of ['not-a-timezone', '', 123]) {
      await request(app.getHttpServer())
        .post(`/quiz-sessions/${sessionId}/complete`)
        .set('Authorization', authorization)
        .send({ timezone })
        .expect(400);
    }
    await request(app.getHttpServer())
      .post(`/quiz-sessions/${sessionId}/complete`)
      .set('Authorization', authorization)
      .send({ timezone: ' Europe/Kyiv ' })
      .expect(201);
    expect(
      await prisma.userStreakProfile.findUnique({ where: { userId } }),
    ).toMatchObject({ timezone: 'Europe/Kyiv' });
    const second = await createAnsweredSession();
    await request(app.getHttpServer())
      .post(`/quiz-sessions/${second}/complete`)
      .set('Authorization', authorization)
      .send({})
      .expect(201);
    expect(
      await prisma.userStreakProfile.findUnique({ where: { userId } }),
    ).toMatchObject({ timezone: 'Europe/Kyiv' });
  });

  it('uses the completion timezone before reconciling missing days at the UTC date boundary', async () => {
    await prisma.userStreakProfile.create({
      data: {
        userId,
        timezone: 'UTC',
        currentStreak: 2,
        longestStreak: 2,
        lastActivityDate: new Date('2026-10-28T00:00:00.000Z'),
      },
    });
    await prisma.userStreakHistory.createMany({
      data: ['2026-10-27', '2026-10-28'].map((date) => ({
        userId,
        activityDate: new Date(`${date}T00:00:00.000Z`),
        status: 'completed',
      })),
    });
    const sessionId = await createAnsweredSession();
    // Freeze calendar time while leaving PostgreSQL/network timers running normally.
    jest.useFakeTimers({
      now: new Date('2026-10-30T01:00:00.000Z'),
      doNotFake: [
        'nextTick',
        'setImmediate',
        'clearImmediate',
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'performance',
        'hrtime',
        'queueMicrotask',
      ],
    });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    authorization = `Bearer ${app.get(JwtService).issueAccessToken({ ...user, createdAt: user.createdAt.toISOString() }).accessToken}`;

    const response = await request(app.getHttpServer())
      .post(`/quiz-sessions/${sessionId}/complete`)
      .set('Authorization', authorization)
      .send({ timezone: 'America/Los_Angeles' })
      .expect(201);

    expect(response.body).toMatchObject({
      replayed: false,
      streak: {
        currentStreak: 3,
        lastActivityDate: '2026-10-29',
        brokenStreakInfo: null,
      },
      completion: {
        newlyUnlockedStreakMilestones: [3],
        rewards: { streakCoins: 30 },
      },
    });
    expect(
      await prisma.userStreakProfile.findUnique({ where: { userId } }),
    ).toMatchObject({ timezone: 'America/Los_Angeles', currentStreak: 3 });
    expect(
      await prisma.userStreakHistory.count({
        where: { userId, status: 'missed' },
      }),
    ).toBe(0);

    // A replay with another timezone must neither reapply activity nor change the stored zone.
    const replay = await request(app.getHttpServer())
      .post(`/quiz-sessions/${sessionId}/complete`)
      .set('Authorization', authorization)
      .send({ timezone: 'UTC' })
      .expect(201);
    expect(replay.body).toMatchObject({
      replayed: true,
      streak: { currentStreak: 3 },
    });
    expect(
      await prisma.userStreakProfile.findUnique({ where: { userId } }),
    ).toMatchObject({ timezone: 'America/Los_Angeles', currentStreak: 3 });
    expect(
      await prisma.user.findUnique({ where: { id: userId } }),
    ).toMatchObject({ balance: 132, testsCompleted: 1 });
    expect(
      await prisma.userStreakAchievement.count({ where: { userId } }),
    ).toBe(1);
  });

  it('commits a streak milestone and quiz reward together without paying either again on replay', async () => {
    const yesterday = new Date();
    yesterday.setUTCHours(0, 0, 0, 0);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const previousDay = new Date(yesterday);
    previousDay.setUTCDate(previousDay.getUTCDate() - 1);
    await prisma.userStreakProfile.create({
      data: {
        userId,
        timezone: 'UTC',
        currentStreak: 2,
        longestStreak: 2,
        lastActivityDate: yesterday,
      },
    });
    await prisma.userStreakHistory.createMany({
      data: [previousDay, yesterday].map((activityDate) => ({
        userId,
        activityDate,
        status: 'completed',
      })),
    });
    const sessionId = await createAnsweredSession();
    const result = await quiz.complete(userId, sessionId, 'UTC');
    expect(result.completion.rewards).toEqual({
      quizCoins: 52,
      achievementCoins: 50,
      streakCoins: 30,
      totalCoins: 132,
    });
    expect(result.completion.newlyUnlockedStreakMilestones).toEqual([3]);
    expect(result.streak).toMatchObject({ currentStreak: 3, coinBalance: 132 });
    await quiz.complete(userId, sessionId, 'UTC');
    expect(
      await prisma.user.findUnique({ where: { id: userId } }),
    ).toMatchObject({ balance: 132, testsCompleted: 1 });
    expect(
      await prisma.userStreakAchievement.count({ where: { userId } }),
    ).toBe(1);
  });

  it('cannot change owners, inspect unknown sessions, or access quizzes without valid authentication', async () => {
    const sessionId = await createAnsweredSession();
    for (const suffix of ['answers', 'complete', 'retake']) {
      await request(app.getHttpServer())
        .post(`/quiz-sessions/${sessionId}/${suffix}`)
        .set('Authorization', 'Bearer invalid')
        .send({})
        .expect(401);
      await request(app.getHttpServer())
        .post(`/quiz-sessions/${randomUUID()}/${suffix}`)
        .set('Authorization', authorization)
        .send(
          suffix === 'answers'
            ? { questionId: 'q-1', selectedOptionIds: ['a'] }
            : {},
        )
        .expect(404);
    }
    await request(app.getHttpServer())
      .post(`/quiz-sessions/${sessionId}/complete`)
      .set('Authorization', authorization)
      .send({ userId: randomUUID() })
      .expect(400);
    expect(
      await prisma.user.findUnique({ where: { id: userId } }),
    ).toMatchObject({ balance: 0, testsCompleted: 0 });
  });
});
