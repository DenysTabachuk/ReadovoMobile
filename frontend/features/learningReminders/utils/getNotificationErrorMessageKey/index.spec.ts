import { HttpError } from '@/api/httpError';
import en from '@/localization/en/translation.json';
import uk from '@/localization/uk/translation.json';
import { getNotificationErrorMessageKey } from '.';

it.each([
  [
    403,
    'NOTIFICATIONS_MANUAL_DISPATCH_DISABLED',
    'settings.learningReminders.manualDispatchDisabled',
  ],
  [
    403,
    'NOTIFICATIONS_DISPATCH_CLEAR_DISABLED',
    'settings.learningReminders.clearDispatchDisabled',
  ],
] as const)(
  'maps %s/%s without relying on message text',
  (status, code, key) => {
    expect(
      getNotificationErrorMessageKey(
        new HttpError({
          status,
          data: { code, message: 'Changed backend wording' },
        }),
      ),
    ).toBe(key);
    expect(
      getNotificationErrorMessageKey(
        new HttpError({ status: 599, data: { code } }),
      ),
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
    getNotificationErrorMessageKey(
      new HttpError({ status: 400, data: { message: 'Not enough coins.' } }),
    ),
  ).toBe('errors.generic');
  expect(
    getNotificationErrorMessageKey(new Error('auth.errors.invalidCredentials')),
  ).toBe('errors.generic');
  expect(
    getNotificationErrorMessageKey(
      Object.assign(new Error(), { name: 'AbortError' }),
    ),
  ).toBeNull();
});
