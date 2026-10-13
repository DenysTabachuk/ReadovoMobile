import {
  parseBrokenStreakInfo,
  serializeBrokenStreakInfo,
} from './streak.persistence';

describe('streak persistence boundary', () => {
  it('validates and parses persisted broken-streak state', () => {
    expect(
      parseBrokenStreakInfo({
        brokenAt: '2026-10-12',
        canRestore: true,
        previousStreak: 6,
        restorePrice: 100,
      }),
    ).toEqual({
      brokenAt: '2026-10-12',
      canRestore: true,
      previousStreak: 6,
      restorePrice: 100,
    });
  });

  it('preserves database null', () => {
    expect(parseBrokenStreakInfo(null)).toBeNull();
    expect(serializeBrokenStreakInfo(null)).toBeNull();
  });

  it.each([
    {
      brokenAt: 'not-a-date',
      canRestore: true,
      previousStreak: 6,
      restorePrice: 100,
    },
    {
      brokenAt: '2026-10-12',
      canRestore: 'yes',
      previousStreak: 6,
      restorePrice: 100,
    },
    {
      brokenAt: '2026-10-12',
      canRestore: true,
      previousStreak: -1,
      restorePrice: 100,
    },
  ])('rejects malformed persisted state', (value) => {
    expect(() => parseBrokenStreakInfo(value)).toThrow(
      'Invalid broken streak information in the database.',
    );
  });

  it('serializes the domain type as a Prisma JSON object', () => {
    expect(
      serializeBrokenStreakInfo({
        brokenAt: '2026-10-12',
        canRestore: false,
        previousStreak: 3,
        restorePrice: 100,
      }),
    ).toEqual({
      brokenAt: '2026-10-12',
      canRestore: false,
      previousStreak: 3,
      restorePrice: 100,
    });
  });
});
