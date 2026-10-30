import { Test, type TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { AchievementsService } from './achievements.service';

describe('AchievementsService', () => {
  let service: AchievementsService;
  let database: PrismaService;
  let balance: number;
  let achievements: Array<{
    achievementId: string;
    claimedAt: Date | null;
    unlockedAt: Date;
    userId: string;
  }>;
  const prisma = {
    $transaction: jest.fn(),
    dictionaryWord: { count: jest.fn() },
    user: { findUnique: jest.fn(), updateMany: jest.fn() },
    userAchievement: { createManyAndReturn: jest.fn(), findMany: jest.fn() },
  };

  beforeEach(async () => {
    balance = 0;
    achievements = [];
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      (callback: (transaction: typeof prisma) => Promise<unknown>) =>
        callback(prisma),
    );
    prisma.dictionaryWord.count.mockResolvedValue(0);
    prisma.user.findUnique.mockImplementation(() =>
      Promise.resolve({
        balance,
        lessonsCompleted: 0,
        testsCompleted: 1,
        wordsLearned: 0,
      }),
    );
    prisma.userAchievement.findMany.mockImplementation(() =>
      Promise.resolve([...achievements]),
    );
    prisma.userAchievement.createManyAndReturn.mockImplementation(
      ({ data }: { data: Array<(typeof achievements)[number]> }) => {
        const inserted = data.filter(
          (candidate) =>
            !achievements.some(
              (achievement) =>
                achievement.achievementId === candidate.achievementId,
            ),
        );
        achievements.push(...inserted);
        return Promise.resolve(
          inserted.map(({ achievementId }) => ({ achievementId })),
        );
      },
    );
    prisma.user.updateMany.mockImplementation(
      ({ data }: { data: { balance?: { increment: number } } }) => {
        balance += data.balance?.increment ?? 0;
        return Promise.resolve({ count: 1 });
      },
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(AchievementsService);
    database = module.get(PrismaService);
  });

  it('awards coins and marks the reward as claimed when unlocked', async () => {
    await service.awardUnlocked('user-1', database);
    const profile = await service.getProfile('user-1');

    expect(profile.progress.balance).toBe(50);
    expect(profile.achievements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          claimedAt: expect.any(String) as string,
          coinsReward: 50,
          id: 'first_test_completed',
          isClaimed: true,
          isUnlocked: true,
        }),
      ]),
    );
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      data: { balance: { increment: 50 } },
      where: { id: 'user-1' },
    });
  });

  it('does not award the same achievement coins more than once', async () => {
    await service.awardUnlocked('user-1', database);
    await service.awardUnlocked('user-1', database);
    const profile = await service.getProfile('user-1');

    expect(profile.progress.balance).toBe(50);
    expect(prisma.user.updateMany).toHaveBeenCalledTimes(1);
  });

  it('returns both achievements when one reward unlocks the next coin threshold', async () => {
    balance = 960;

    const granted = await service.awardUnlocked('user-1', database);

    expect(granted.map((achievement) => achievement.id)).toEqual([
      'first_test_completed',
      'first_thousand_coins',
    ]);
    expect(balance).toBe(1210);
    expect(granted.every((achievement) => achievement.isClaimed)).toBe(true);

    expect(await service.awardUnlocked('user-1', database)).toEqual([]);
    expect(balance).toBe(1210);
  });

  it('does not grant coins when all attempted inserts are skipped', async () => {
    prisma.userAchievement.createManyAndReturn.mockResolvedValueOnce([]);

    expect(await service.awardUnlocked('user-1', database)).toEqual([]);
    expect(balance).toBe(0);
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });
});
