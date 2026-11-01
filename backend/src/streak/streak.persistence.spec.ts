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
      }),
    ).toEqual({
      brokenAt: '2026-10-12',
      canRestore: true,
      previousStreak: 6,
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
    },
    {
      brokenAt: '2026-10-12',
      canRestore: 'yes',
      previousStreak: 6,
    },
    {
      brokenAt: '2026-10-12',
      canRestore: true,
      previousStreak: -1,
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
      }),
    ).toEqual({
      brokenAt: '2026-10-12',
      canRestore: false,
      previousStreak: 3,
    });
  });

  it('reads legacy records without keeping the obsolete price', () => {
    const legacyInfo = {
      brokenAt: '2026-10-12',
      canRestore: true,
      previousStreak: 6,
      restorePrice: 1,
    };

    expect(parseBrokenStreakInfo(legacyInfo)).toEqual({
      brokenAt: '2026-10-12',
      canRestore: true,
      previousStreak: 6,
    });
    expect(legacyInfo.restorePrice).toBe(1);
  });

  it('omits response-only pricing when serializing an object with extra fields', () => {
    const responseInfo = {
      brokenAt: '2026-10-12',
      canRestore: true,
      previousStreak: 6,
      restorePrice: 100,
    };

    expect(serializeBrokenStreakInfo(responseInfo)).toEqual({
      brokenAt: '2026-10-12',
      canRestore: true,
      previousStreak: 6,
    });
    expect(responseInfo.restorePrice).toBe(100);
  });
});
