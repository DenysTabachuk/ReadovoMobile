import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { type Server } from 'node:http';

import { JwtService } from '../../auth/jwt.service';
import { UserAuthGuard } from '../../auth/user-auth.guard';
import { configureApiBoundaries } from '../../common/configure-api-boundaries';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsController } from '../notifications.controller';
import { NotificationsService } from '../notifications.service';
import { type LearningReminderPreferences } from '../types';

// Exercise the real unconfigured-provider outcome without reading credentials or
// initializing Firebase. Delivery SDK behavior is outside these HTTP suites.
jest.mock('firebase-admin/app', () => ({
  getApps: () => {
    throw new Error('Firebase disabled in HTTP tests.');
  },
}));

export const NOTIFICATIONS_TEST_USER_ID =
  '11111111-1111-4111-8111-111111111111';
export const NOTIFICATIONS_TEST_TOKEN = {
  deviceId: 'test-device',
  platform: 'android',
  provider: 'fcm',
  pushToken: 'private-push-token-12345678901234567890',
};

/**
 * Creates a notifications HTTP app with real services, guards and API boundaries.
 * @returns App/server, owner authorization and fresh narrow persistence mocks.
 * Firebase discovery is mocked as unavailable; no credentials are read and no
 * notifications are sent. Dispatch has no eligible users by default. The caller
 * must await app.close(), which clears the real service's background interval.
 * No environment variables or clocks are changed.
 * @example
 * const testApp = await createNotificationsHttpApp();
 * testApp.prisma.userPushToken.upsert.mockRejectedValue(new Error('DB failure'));
 * // Push-token registration now returns the generic INTERNAL_ERROR response.
 * await testApp.app.close();
 */
export async function createNotificationsHttpApp() {
  const preferences: LearningReminderPreferences = {
    learningReminderTime: '19:00',
    learningRemindersEnabled: false,
  };
  const prisma = {
    userNotificationPreference: {
      upsert: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(),
      findUniqueOrThrow: jest
        .fn<Promise<LearningReminderPreferences>, [unknown]>()
        .mockResolvedValue(preferences),
      findMany: jest.fn<Promise<never[]>, [unknown]>().mockResolvedValue([]),
    },
    userPushToken: {
      updateMany: jest
        .fn<Promise<{ count: number }>, [unknown]>()
        .mockResolvedValue({ count: 0 }),
      upsert: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(),
      findMany: jest
        .fn<
          Promise<Array<{ deviceId: string; pushToken: string | null }>>,
          [unknown]
        >()
        .mockResolvedValue([]),
    },
    userStreakProfile: {
      findUnique: jest
        .fn<Promise<{ timezone: string } | null>, [unknown]>()
        .mockResolvedValue(null),
    },
    userLearningReminderDispatch: {
      deleteMany: jest
        .fn<Promise<{ count: number }>, [unknown]>()
        .mockResolvedValue({ count: 2 }),
    },
  };
  const module = await Test.createTestingModule({
    controllers: [NotificationsController],
    providers: [
      NotificationsService,
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
    id: NOTIFICATIONS_TEST_USER_ID,
    email: 'reader@example.test',
    createdAt: '2026-10-29T12:00:00.000Z',
    balance: 0,
    lessonsCompleted: 0,
    testsCompleted: 0,
    wordsLearned: 0,
  }).accessToken;
  return {
    app,
    server: app.getHttpServer(),
    authorization: `Bearer ${token}`,
    prisma,
    preferences,
  };
}

export type NotificationsHttpTestApp = Awaited<
  ReturnType<typeof createNotificationsHttpApp>
>;
