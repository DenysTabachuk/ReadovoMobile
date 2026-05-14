import { Test, type TestingModule } from '@nestjs/testing';

import { DatabaseService } from '../database/database.service';
import { AchievementsService } from './achievements.service';
import { type AchievementId } from './types';

type MockUser = {
  balance: number;
  lessons_completed: number;
  tests_completed: number;
  words_learned: number;
};

type MockAchievementRow = {
  achievement_id: AchievementId;
  claimed_at: Date | null;
  unlocked_at: Date;
};

describe('AchievementsService', () => {
  let service: AchievementsService;
  let queryMock: jest.Mock;
  let user: MockUser;
  let learnedWordsCount: number;
  let achievements: MockAchievementRow[];

  beforeEach(async () => {
    user = {
      balance: 0,
      lessons_completed: 0,
      tests_completed: 1,
      words_learned: 0,
    };
    learnedWordsCount = 0;
    achievements = [];

    queryMock = jest
      .fn()
      .mockImplementation((text: string, values?: unknown[]) => {
        if (
          text.includes(
            'SELECT lessons_completed, tests_completed, words_learned, balance',
          )
        ) {
          return Promise.resolve({
            rows: [user],
          });
        }

        if (
          text.includes('SELECT COUNT(*)::text AS count') &&
          text.includes('FROM dictionary_words')
        ) {
          return Promise.resolve({
            rows: [{ count: String(learnedWordsCount) }],
          });
        }

        if (text.includes('SELECT achievement_id, unlocked_at, claimed_at')) {
          return Promise.resolve({
            rows: achievements,
          });
        }

        if (text.includes('INSERT INTO user_achievements')) {
          const achievementId = values?.[1] as AchievementId;
          const existingAchievement = achievements.find(
            (achievement) => achievement.achievement_id === achievementId,
          );

          if (existingAchievement) {
            return Promise.resolve({ rows: [] });
          }

          const insertedAchievement: MockAchievementRow = {
            achievement_id: achievementId,
            claimed_at: new Date('2026-05-10T18:00:00.000Z'),
            unlocked_at: new Date('2026-05-10T18:00:00.000Z'),
          };

          achievements.push(insertedAchievement);

          return Promise.resolve({
            rows: [{ achievement_id: achievementId }],
          });
        }

        if (
          text.includes('UPDATE users') &&
          text.includes('SET balance = balance + $2')
        ) {
          user.balance += Number(values?.[1] ?? 0);

          return Promise.resolve({ rows: [] });
        }

        throw new Error(`Unexpected query: ${text}`);
      });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementsService,
        {
          provide: DatabaseService,
          useValue: {
            query: queryMock,
          },
        },
      ],
    }).compile();

    service = module.get(AchievementsService);
  });

  it('awards coins and marks the reward as claimed when an achievement is unlocked', async () => {
    const profile = await service.getProfile('user-1');

    expect(profile.progress.balance).toBe(50);
    expect(profile.achievements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          claimedAt: '2026-05-10T18:00:00.000Z',
          coinsReward: 50,
          id: 'first_test_completed',
          isClaimed: true,
          isUnlocked: true,
        }),
      ]),
    );
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('SET balance = balance + $2'),
      ['user-1', 50],
    );
  });

  it('does not award the same achievement coins more than once', async () => {
    await service.getProfile('user-1');
    const profile = await service.getProfile('user-1');

    expect(profile.progress.balance).toBe(50);
    expect(
      queryMock.mock.calls.filter(
        ([text]) =>
          typeof text === 'string' &&
          text.includes('SET balance = balance + $2'),
      ),
    ).toHaveLength(1);
  });
});
