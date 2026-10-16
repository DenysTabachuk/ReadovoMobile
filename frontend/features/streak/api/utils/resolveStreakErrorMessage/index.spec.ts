import { resolveStreakErrorMessage } from './index';

describe('resolveStreakErrorMessage', () => {
  it.each([
    ['Not enough coins.', 'streak.errors.notEnoughCoins'],
    ['Freeze token limit reached.', 'streak.errors.freezeLimitReached'],
    ['Freeze day limit reached.', 'streak.errors.freezeDayLimitReached'],
    ['No freeze tokens available.', 'streak.errors.noFreezeTokens'],
    [
      'Freeze is only available for recently missed days.',
      'streak.errors.freezeWindowExpired',
    ],
    [
      'Freeze is only available for the last 3 missed days.',
      'streak.errors.freezeWindowExpired',
    ],
    [
      'Freeze can only be applied to a missed day.',
      'streak.errors.freezeOnlyMissed',
    ],
    ['This day is already protected.', 'streak.errors.dayAlreadyProtected'],
  ])('maps %s', async (message, expected) => {
    const response = Response.json({ message });
    await expect(resolveStreakErrorMessage(response, 'fallback')).resolves.toBe(
      expected,
    );
    expect(response.bodyUsed).toBe(true);
  });
  it('uses only the first error in a message array', async () => {
    await expect(
      resolveStreakErrorMessage(
        Response.json({ message: ['Not enough coins.', 'Other'] }),
        'fallback',
      ),
    ).resolves.toBe('streak.errors.notEnoughCoins');
    await expect(
      resolveStreakErrorMessage(
        Response.json({ message: ['Other', 'Not enough coins.'] }),
        'fallback',
      ),
    ).resolves.toBe('fallback');
  });
  it.each(['constructor', 'toString', '__proto__', 42, { code: 'unknown' }])(
    'falls back for an unmapped or non-string message %j',
    async (message) => {
      await expect(
        resolveStreakErrorMessage(Response.json({ message }), 'fallback'),
      ).resolves.toBe('fallback');
    },
  );
  it('falls back for missing/unknown messages, malformed JSON, or an already-consumed response', async () => {
    for (const payload of [{}, { message: [] }, { message: 'Unknown' }, null]) {
      await expect(
        resolveStreakErrorMessage(Response.json(payload), 'fallback'),
      ).resolves.toBe('fallback');
    }
    await expect(
      resolveStreakErrorMessage(new Response('invalid'), 'fallback'),
    ).resolves.toBe('fallback');
    const consumed = Response.json({ message: 'Not enough coins.' });
    await consumed.json();
    await expect(resolveStreakErrorMessage(consumed, 'fallback')).resolves.toBe(
      'fallback',
    );
  });
});
