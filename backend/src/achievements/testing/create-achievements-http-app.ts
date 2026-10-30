import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { type Server } from 'node:http';

import { JwtService } from '../../auth/jwt.service';
import { UserAuthGuard } from '../../auth/user-auth.guard';
import { configureApiBoundaries } from '../../common/configure-api-boundaries';
import { type UserAchievement } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AchievementsController } from '../achievements.controller';
import { AchievementsService } from '../achievements.service';
import { type UserProgress } from '../types';

export const ACHIEVEMENTS_TEST_USER_ID = '11111111-1111-4111-8111-111111111111';

type ProgressUpdate = { data: UserProgress; where: { id: string } };

/**
 * Creates an achievements HTTP app with real services/guards and fresh DB mocks.
 * @returns The app/server, authorization, initial user and persistence mocks.
 * Progress writes update the mocked read result. Reward transactions reject by
 * default; existing reward unit tests cover that separate behavior. No hooks or
 * globals are changed. The caller must await app.close().
 * @example
 * const testApp = await createAchievementsHttpApp();
 * testApp.prisma.user.findUnique.mockResolvedValue(null);
 * // GET /achievements/profile/me now returns ACHIEVEMENTS_USER_NOT_FOUND.
 * await testApp.app.close();
 */
export async function createAchievementsHttpApp() {
  const user: UserProgress = {
    balance: 25,
    lessonsCompleted: 2,
    testsCompleted: 0,
    wordsLearned: 0,
  };
  const prisma = {
    user: {
      findUnique: jest
        .fn<Promise<UserProgress | null>, [unknown]>()
        .mockResolvedValue(user),
      updateMany: jest.fn<Promise<{ count: number }>, [ProgressUpdate]>(),
    },
    dictionaryWord: {
      count: jest.fn<Promise<number>, [unknown]>().mockResolvedValue(3),
    },
    userAchievement: {
      findMany: jest
        .fn<Promise<UserAchievement[]>, [unknown]>()
        .mockResolvedValue([]),
    },
    $transaction: jest
      .fn()
      .mockRejectedValue(new Error('Unexpected reward transaction')),
  };
  prisma.user.updateMany.mockImplementation(({ data }) => {
    prisma.user.findUnique.mockResolvedValue({ ...data });
    return Promise.resolve({ count: 1 });
  });
  const module = await Test.createTestingModule({
    controllers: [AchievementsController],
    providers: [
      AchievementsService,
      JwtService,
      UserAuthGuard,
      { provide: PrismaService, useValue: prisma },
    ],
  }).compile();
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
    id: ACHIEVEMENTS_TEST_USER_ID,
    email: 'reader@example.test',
    createdAt: '2026-10-28T12:00:00.000Z',
  }).accessToken;
  return {
    app,
    server: app.getHttpServer(),
    authorization: `Bearer ${token}`,
    prisma,
    user,
  };
}

export type AchievementsHttpTestApp = Awaited<
  ReturnType<typeof createAchievementsHttpApp>
>;
