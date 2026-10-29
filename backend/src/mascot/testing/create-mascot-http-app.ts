import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { type Server } from 'node:http';

import { JwtService } from '../../auth/jwt.service';
import { UserAuthGuard } from '../../auth/user-auth.guard';
import { configureApiBoundaries } from '../../common/configure-api-boundaries';
import { type UserMascotProfile } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MascotController } from '../mascot.controller';
import { MascotService } from '../mascot.service';

export const MASCOT_TEST_USER_ID = '11111111-1111-4111-8111-111111111111';

/**
 * Creates a real mascot HTTP app with fresh, narrowly scoped persistence mocks.
 * @returns The app/server, authorization header, profile fixture and typed mocks.
 * Callers configure scenario overrides and must await app.close(). No hooks or
 * globals are changed. Unexpected mutations reject until explicitly configured.
 * @example
 * const testApp = await createMascotHttpApp();
 * testApp.prisma.user.findUnique.mockResolvedValue(null);
 * // GET /mascot/profile/:userId now exercises the real missing-user branch.
 * await testApp.app.close();
 */
export async function createMascotHttpApp() {
  const profile: UserMascotProfile = {
    userId: MASCOT_TEST_USER_ID,
    equippedHeadItemId: null,
    equippedEyesItemId: null,
    equippedGlassesId: null,
    equippedHatId: null,
    equippedBandanaId: null,
    equippedEyePatchId: null,
    ownedItemIds: [],
    updatedAt: new Date('2026-10-28T12:00:00.000Z'),
  };
  const prisma = {
    user: {
      findUnique: jest
        .fn<Promise<{ id: string; balance: number } | null>, [unknown]>()
        .mockResolvedValue({ id: MASCOT_TEST_USER_ID, balance: 0 }),
      update: jest
        .fn<Promise<void>, [unknown]>()
        .mockRejectedValue(new Error('Unexpected balance mutation')),
    },
    userMascotProfile: {
      upsert: jest
        .fn<Promise<UserMascotProfile>, [unknown]>()
        .mockResolvedValue(profile),
      update: jest
        .fn<Promise<UserMascotProfile>, [unknown]>()
        .mockRejectedValue(new Error('Unexpected mascot mutation')),
    },
  };
  const module = await Test.createTestingModule({
    controllers: [MascotController],
    providers: [
      MascotService,
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
    id: MASCOT_TEST_USER_ID,
    email: 'reader@example.test',
    balance: 0,
    createdAt: '2026-10-28T12:00:00.000Z',
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

export type MascotHttpTestApp = Awaited<ReturnType<typeof createMascotHttpApp>>;
