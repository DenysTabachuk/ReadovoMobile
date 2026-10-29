import { HttpError } from '@/api/httpError';
import en from '@/localization/en/translation.json';
import uk from '@/localization/uk/translation.json';
import { getStreakErrorMessageKey } from '.';

it.each([
  [400, 'STREAK_NOT_ENOUGH_COINS', 'streak.errors.notEnoughCoins'],
  [
    400,
    'STREAK_FREEZE_TOKEN_LIMIT_REACHED',
    'streak.errors.freezeLimitReached',
  ],
  [
    400,
    'STREAK_FREEZE_DAY_LIMIT_REACHED',
    'streak.errors.freezeDayLimitReached',
  ],
  [400, 'STREAK_NO_FREEZE_TOKENS', 'streak.errors.noFreezeTokens'],
  [400, 'STREAK_FREEZE_ONLY_MISSED_DAY', 'streak.errors.freezeOnlyMissed'],
  [400, 'STREAK_DAY_ALREADY_PROTECTED', 'streak.errors.dayAlreadyProtected'],
  [400, 'STREAK_RESTORE_UNAVAILABLE', 'streak.errors.restoreUnavailable'],
  [
    400,
    'STREAK_CALENDAR_MONTH_UNAVAILABLE',
    'streak.errors.calendarUnavailable',
  ],
  [400, 'STREAK_RESTORE_PRICE_INVALID', 'streak.errors.priceChanged'],
  [400, 'STREAK_FREEZE_TOKEN_PRICE_INVALID', 'streak.errors.priceChanged'],
] as const)(
  'maps %s/%s without relying on message text',
  (status, code, key) => {
    expect(
      getStreakErrorMessageKey(
        new HttpError({
          status,
          data: { code, message: 'Changed backend wording' },
        }),
      ),
    ).toBe(key);
    expect(
      getStreakErrorMessageKey(new HttpError({ status: 599, data: { code } })),
    ).toBe('errors.generic');
    for (const locale of [en, uk]) {
      let value: unknown = locale;
      for (const segment of key.split('.')) {
        if (typeof value !== 'object' || value === null || !(segment in value))
          throw new Error('Missing translation: ' + key);
        value = Reflect.get(value, segment);
      }
      expect(typeof value).toBe('string');
    }
  },
);
it('ignores legacy messages and preserves silent cancellation', () => {
  expect(
    getStreakErrorMessageKey(
      new HttpError({ status: 400, data: { message: 'Not enough coins.' } }),
    ),
  ).toBe('errors.generic');
  expect(
    getStreakErrorMessageKey(new Error('auth.errors.invalidCredentials')),
  ).toBe('errors.generic');
  expect(
    getStreakErrorMessageKey(
      Object.assign(new Error(), { name: 'AbortError' }),
    ),
  ).toBeNull();
});
