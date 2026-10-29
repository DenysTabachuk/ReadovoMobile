import { HttpError } from '@/api/httpError';
import en from '@/localization/en/translation.json';
import uk from '@/localization/uk/translation.json';
import { getMascotErrorMessageKey } from '.';

it.each([
  [400, 'MASCOT_NOT_ENOUGH_COINS', 'mascot.errors.notEnoughCoins'],
  [400, 'MASCOT_ITEM_NOT_OWNED', 'mascot.errors.itemNotOwned'],
  [400, 'MASCOT_ITEM_UNKNOWN', 'mascot.errors.itemUnknown'],
] as const)(
  'maps %s/%s without relying on message text',
  (status, code, key) => {
    expect(
      getMascotErrorMessageKey(
        new HttpError({
          status,
          data: { code, message: 'Changed backend wording' },
        }),
      ),
    ).toBe(key);
    expect(
      getMascotErrorMessageKey(new HttpError({ status: 599, data: { code } })),
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
    getMascotErrorMessageKey(
      new HttpError({ status: 400, data: { message: 'Not enough coins.' } }),
    ),
  ).toBe('errors.generic');
  expect(
    getMascotErrorMessageKey(new Error('auth.errors.invalidCredentials')),
  ).toBe('errors.generic');
  expect(
    getMascotErrorMessageKey(
      Object.assign(new Error(), { name: 'AbortError' }),
    ),
  ).toBeNull();
});
