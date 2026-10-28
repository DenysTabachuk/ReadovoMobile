import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { type Server } from 'node:http';

import { JwtService } from '../../auth/jwt.service';
import { UserAuthGuard } from '../../auth/user-auth.guard';
import { configureApiBoundaries } from '../../common/configure-api-boundaries';
import {
  type UserStreakHistory,
  type UserStreakProfile,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StreakController } from '../streak.controller';
import { StreakService } from '../streak.service';

export const STREAK_TEST_USER_ID = '11111111-1111-4111-8111-111111111111';
export const STREAK_TEST_NOW = '2026-10-28T12:00:00.000Z';

/**
 * Creates a real streak HTTP app with fresh persistence mocks for one test.
 * @returns The app/server, JWT authorization, default profile and mutable mocks.
 * Only persistence is replaced. No Jest hooks, clocks or environment changes are
 * installed; the caller must close the app. Unexpected writes fail deliberately.
 * @example
 * const testApp = await createStreakHttpApp();
 * testApp.prisma.user.findUnique.mockResolvedValue(null); // simulate a missing user
 * // GET /streak/profile/me now reaches the real service's missing-user branch.
 * await testApp.app.close();
 */
export async function createStreakHttpApp() {
  const profile: UserStreakProfile = {
    userId: STREAK_TEST_USER_ID,
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    freezeTokens: 1,
    timezone: 'UTC',
    brokenStreakInfo: null,
    updatedAt: new Date(STREAK_TEST_NOW),
  };
  const prisma = {
    user: {
      findUnique: jest
        .fn<Promise<{ id: string; balance: number } | null>, [unknown]>()
        .mockResolvedValue({ id: STREAK_TEST_USER_ID, balance: 0 }),
      update: jest
        .fn()
        .mockRejectedValue(new Error('Unexpected balance mutation')),
    },
    userStreakProfile: {
      upsert: jest
        .fn<Promise<UserStreakProfile>, [unknown]>()
        .mockResolvedValue(profile),
      update: jest
        .fn()
        .mockRejectedValue(new Error('Unexpected profile mutation')),
      updateMany: jest
        .fn()
        .mockRejectedValue(new Error('Unexpected profile mutation')),
    },
    userStreakHistory: {
      findUnique: jest
        .fn<Promise<UserStreakHistory | null>, [unknown]>()
        .mockResolvedValue(null),
      findMany: jest
        .fn<Promise<UserStreakHistory[]>, [unknown]>()
        .mockResolvedValue([]),
      upsert: jest
        .fn()
        .mockRejectedValue(new Error('Unexpected history mutation')),
      updateMany: jest
        .fn()
        .mockRejectedValue(new Error('Unexpected history mutation')),
    },
    userStreakAchievement: {
      findMany: jest.fn<Promise<never[]>, [unknown]>().mockResolvedValue([]),
    },
  };
  const module = await Test.createTestingModule({
    controllers: [StreakController],
    providers: [
      StreakService,
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
    id: STREAK_TEST_USER_ID,
    email: 'reader@example.test',
    balance: 0,
    createdAt: STREAK_TEST_NOW,
    lessonsCompleted: 0,
    testsCompleted: 0,
    wordsLearned: 0,
  }).accessToken;
  return {
    app,
    server: app.getHttpServer(),
    authorization: `Bearer ${token}`,
    prisma,
    profile,
  };
}

export type StreakHttpTestApp = Awaited<ReturnType<typeof createStreakHttpApp>>;
