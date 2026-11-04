import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { type Server } from 'node:http';

import { JwtService } from '../../auth/jwt.service';
import { configureApiBoundaries } from '../../common/configure-api-boundaries';
import {
  type Prisma,
  type QuizAnswer,
  type QuizSession,
  type UserAchievement,
  type UserStreakHistory,
  type UserStreakProfile,
} from '../../generated/prisma/client';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';
import { QuizModule } from '../quiz.module';

type UserRow = {
  id: string;
  balance: number;
  testsCompleted: number;
  lessonsCompleted: number;
  wordsLearned: number;
};
type UserUpdate = {
  data: {
    balance: { increment: number };
    testsCompleted?: { increment: number };
  };
};
type SessionUpdate = {
  data: { completedAt: Date; completion: Prisma.JsonObject };
};
type SessionCreate = {
  data: {
    id: string;
    userId: string;
    kind: string;
    level?: string;
    targetLength?: string;
    questions: Prisma.JsonValue;
  };
};

export const QUIZ_TEST_USER_ID = '11111111-1111-4111-8111-111111111111';
export const QUIZ_TEST_SESSION_ID = '33333333-3333-4333-8333-333333333333';
export const QUIZ_TEST_NOW = '2026-10-28T12:00:00.000Z';

/**
 * Creates a quiz HTTP app with real modules and fresh, narrowly scoped DB mocks.
 * @returns The initialized app/server, JWT, mutable session/answer/user fixtures
 * and persistence mocks. The caller controls the clock and must close the app.
 * Transactions invoke their callback but do not simulate DB locking or rollback;
 * PostgreSQL integration tests own those guarantees. Unexpected reward writes fail.
 * @example
 * const testApp = await createQuizHttpApp();
 * testApp.session.completedAt = new Date(QUIZ_TEST_NOW);
 * // A new answer to this completed session returns QUIZ_SESSION_COMPLETED.
 * await testApp.app.close();
 */
export async function createQuizHttpApp() {
  const user: UserRow = {
    id: QUIZ_TEST_USER_ID,
    balance: 100,
    testsCompleted: 1,
    lessonsCompleted: 0,
    wordsLearned: 0,
  };
  const answers: QuizAnswer[] = [];
  const session: QuizSession = {
    id: QUIZ_TEST_SESSION_ID,
    userId: user.id,
    kind: 'vocabulary',
    level: null,
    targetLength: null,
    completedAt: null,
    completion: null,
    createdAt: new Date(QUIZ_TEST_NOW),
    questions: [
      {
        id: 'q-1',
        type: 'single_choice',
        optionIds: ['a', 'b'],
        correctOptionIds: ['a'],
        explanation: 'The selected word means book.',
        vocabularyWord: {
          term: 'book',
          translation: 'книга',
          sourceExcerpt: 'Read a book.',
        },
      },
    ],
  };
  const streakProfile: UserStreakProfile = {
    userId: user.id,
    currentStreak: 1,
    longestStreak: 1,
    freezeTokens: 1,
    lastActivityDate: new Date('2026-10-28T00:00:00.000Z'),
    timezone: 'UTC',
    brokenStreakInfo: null,
    updatedAt: new Date(QUIZ_TEST_NOW),
  };
  const transaction = {
    $queryRaw: jest
      .fn<Promise<unknown[]>, [unknown, ...unknown[]]>()
      .mockResolvedValue([{ id: user.id }]),
    user: {
      findUnique: jest
        .fn<Promise<UserRow | null>, [unknown]>()
        .mockImplementation(() => Promise.resolve(user)),
      update: jest
        .fn<Promise<UserRow>, [UserUpdate]>()
        .mockImplementation(({ data }) => {
          user.balance += data.balance.increment;
          user.testsCompleted += data.testsCompleted?.increment ?? 0;
          return Promise.resolve(user);
        }),
    },
    quizSession: {
      findFirst: jest
        .fn<
          Promise<QuizSession | null>,
          [{ where: { id: string; userId: string } }]
        >()
        .mockImplementation(({ where }) =>
          Promise.resolve(
            where.id === session.id && where.userId === session.userId
              ? session
              : null,
          ),
        ),
      update: jest
        .fn<Promise<QuizSession>, [SessionUpdate]>()
        .mockImplementation(({ data }) => {
          session.completedAt = data.completedAt;
          session.completion = data.completion;
          return Promise.resolve(session);
        }),
      create: jest
        .fn<Promise<QuizSession>, [SessionCreate]>()
        .mockImplementation(({ data }) =>
          Promise.resolve({
            ...session,
            ...data,
            level: data.level ?? null,
            targetLength: data.targetLength ?? null,
            completion: null,
            completedAt: null,
            createdAt: new Date(QUIZ_TEST_NOW),
          }),
        ),
    },
    quizAnswer: {
      findUnique: jest
        .fn<
          Promise<QuizAnswer | null>,
          [
            {
              where: {
                sessionId_questionId: { sessionId: string; questionId: string };
              };
            },
          ]
        >()
        .mockImplementation(({ where }) =>
          Promise.resolve(
            answers.find(
              (answer) =>
                answer.sessionId === where.sessionId_questionId.sessionId &&
                answer.questionId === where.sessionId_questionId.questionId,
            ) ?? null,
          ),
        ),
      findMany: jest
        .fn<Promise<QuizAnswer[]>, [unknown]>()
        .mockImplementation(() => Promise.resolve([...answers])),
      create: jest
        .fn<Promise<QuizAnswer>, [{ data: QuizAnswer }]>()
        .mockImplementation(({ data }) => {
          answers.push(data);
          return Promise.resolve(data);
        }),
    },
    dictionaryWord: {
      count: jest.fn<Promise<number>, [unknown]>().mockResolvedValue(0),
    },
    userAchievement: {
      findMany: jest
        .fn<Promise<UserAchievement[]>, [unknown]>()
        .mockResolvedValue([
          {
            userId: user.id,
            achievementId: 'first_test_completed',
            claimedAt: new Date(QUIZ_TEST_NOW),
            unlockedAt: new Date(QUIZ_TEST_NOW),
          },
        ]),
      createManyAndReturn: jest
        .fn<Promise<never>, [unknown]>()
        .mockRejectedValue(new Error('Unexpected achievement grant')),
    },
    userStreakProfile: {
      upsert: jest
        .fn<Promise<UserStreakProfile>, [{ update: { timezone?: string } }]>()
        .mockImplementation(({ update }) => {
          if (update.timezone) streakProfile.timezone = update.timezone;
          return Promise.resolve(streakProfile);
        }),
    },
    userStreakHistory: {
      findUnique: jest
        .fn<Promise<UserStreakHistory>, [unknown]>()
        .mockResolvedValue({
          userId: user.id,
          activityDate: new Date('2026-10-28T00:00:00.000Z'),
          status: 'completed',
          createdAt: new Date(QUIZ_TEST_NOW),
        }),
      findMany: jest
        .fn<Promise<UserStreakHistory[]>, [unknown]>()
        .mockResolvedValue([
          {
            userId: user.id,
            activityDate: new Date('2026-10-28T00:00:00.000Z'),
            status: 'completed',
            createdAt: new Date(QUIZ_TEST_NOW),
          },
        ]),
    },
    userStreakAchievement: {
      findMany: jest.fn<Promise<never[]>, [unknown]>().mockResolvedValue([]),
    },
  };
  const prisma = {
    ...transaction,
    $transaction: jest
      .fn<
        Promise<unknown>,
        [(client: typeof transaction) => Promise<unknown>]
      >()
      .mockImplementation((operation) => operation(transaction)),
  };
  const module = await Test.createTestingModule({
    imports: [PrismaModule, QuizModule],
  })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .compile();
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
    ...user,
    email: 'reader@example.test',
    createdAt: QUIZ_TEST_NOW,
  }).accessToken;
  return {
    app,
    server: app.getHttpServer(),
    authorization: `Bearer ${token}`,
    user,
    session,
    answers,
    prisma,
  };
}

export type QuizHttpTestApp = Awaited<ReturnType<typeof createQuizHttpApp>>;
