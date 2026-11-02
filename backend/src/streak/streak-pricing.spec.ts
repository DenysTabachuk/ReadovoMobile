import { Test } from '@nestjs/testing';

import type { UserStreakProfile } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StreakService } from './streak.service';
import type { StreakState } from './types';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const NOW = '2026-11-01T12:00:00.000Z';

describe('Streak server pricing', () => {
  const createPrisma = () => ({
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: USER_ID, balance: 200 }),
      update: jest.fn().mockResolvedValue(undefined),
    },
    userStreakProfile: {
      upsert: jest.fn<Promise<UserStreakProfile>, [unknown]>(),
      update: jest.fn().mockResolvedValue(undefined),
      updateMany: jest.fn().mockResolvedValue(undefined),
    },
    userStreakHistory: {
      upsert: jest.fn().mockResolvedValue(undefined),
      findMany: jest.fn().mockResolvedValue([
        {
          activityDate: new Date('2026-10-31T00:00:00.000Z'),
          status: 'restored',
        },
      ]),
    },
  });
  let prisma: ReturnType<typeof createPrisma>;
  let service: StreakService;
  const response: StreakState = {
    activityHistory: [],
    brokenStreakInfo: null,
    claimedStreakAchievements: [],
    coinBalance: 100,
    currentStreak: 1,
    restorePrice: 100,

    freezeTokenPrice: 100,
    freezeTokens: 2,
    lastActivityDate: '2026-10-31',
    longestStreak: 1,
    nextBonusInDays: 2,
    nextMilestone: 3,
    serverNow: NOW,
    todayStatus: 'pending',
  };

  beforeEach(async () => {
    jest.useFakeTimers({ now: new Date(NOW) });
    prisma = createPrisma();
    prisma.userStreakProfile.upsert.mockResolvedValue({
      userId: USER_ID,
      currentStreak: 0,
      longestStreak: 1,
      freezeTokens: 1,
      lastActivityDate: null,
      timezone: 'UTC',
      // Even a stale stored display price cannot set the amount charged.
      brokenStreakInfo: {
        brokenAt: '2026-10-31',
        canRestore: true,
        previousStreak: 1,
        restorePrice: 1,
      },
      updatedAt: new Date(NOW),
    });
    const module = await Test.createTestingModule({
      providers: [StreakService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(StreakService);
    jest.spyOn(service, 'getProfile').mockResolvedValue(response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it.each(['restore', 'purchaseFreezeToken'] as const)(
    '%s charges the server price without accepting a client amount',
    async (operation) => {
      await service[operation](USER_ID);

      expect(prisma.user.update).toHaveBeenCalledTimes(1);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: USER_ID },
        data: { balance: { decrement: 100 } },
      });
    },
  );
});
