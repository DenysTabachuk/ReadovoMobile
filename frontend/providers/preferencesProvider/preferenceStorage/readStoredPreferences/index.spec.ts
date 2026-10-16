import { readStoredPreferences } from './index';
import { PREFERENCE_STORAGE_KEYS } from '../constants';

describe('readStoredPreferences', () => {
  it('returns safe defaults when storage contains no preferences', async () => {
    const storage = {
      getItem: jest.fn(async () => null),
      setItem: jest.fn(async () => {}),
    };
    await expect(readStoredPreferences(storage)).resolves.toEqual({
      hasCompletedOnboarding: false,
      languagePreference: undefined,
      themePreference: undefined,
      learningReminderEnabled: false,
      learningReminderTime: undefined,
    });
    expect(storage.getItem).toHaveBeenCalledTimes(5);
  });
  it('preserves valid localized preferences and the midnight boundary', async () => {
    const values: Record<string, string> = {
      [PREFERENCE_STORAGE_KEYS.onboarding]: 'true',
      [PREFERENCE_STORAGE_KEYS.language]: 'uk',
      [PREFERENCE_STORAGE_KEYS.theme]: 'system',
      [PREFERENCE_STORAGE_KEYS.learningReminderEnabled]: 'true',
      [PREFERENCE_STORAGE_KEYS.learningReminderTime]: '00:00',
    };
    const storage = {
      getItem: async (key: string) => values[key] ?? null,
      setItem: async () => {},
    };
    await expect(readStoredPreferences(storage)).resolves.toEqual({
      hasCompletedOnboarding: true,
      languagePreference: 'uk',
      themePreference: 'system',
      learningReminderEnabled: true,
      learningReminderTime: '00:00',
    });
  });
  it('rejects storage failures rather than silently discarding them', async () => {
    const error = new Error('Storage unavailable');
    const storage = {
      getItem: jest.fn().mockRejectedValue(error),
      setItem: jest.fn(),
    };
    await expect(readStoredPreferences(storage)).rejects.toBe(error);
  });
});
