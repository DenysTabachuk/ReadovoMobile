import { PREFERENCE_STORAGE_KEYS } from './constants';
import { readStoredPreferences } from './readStoredPreferences';
import { saveCompletedOnboarding } from './saveCompletedOnboarding';
import { saveLanguagePreference } from './saveLanguagePreference';
import { saveLearningReminderEnabled } from './saveLearningReminderEnabled';
import { saveLearningReminderTime } from './saveLearningReminderTime';
import { saveThemePreference } from './saveThemePreference';
import { type PreferenceStorageBackend } from './types';

function createMemoryBackend(): PreferenceStorageBackend {
  const values = new Map<string, string>();

  return {
    async getItem(key) {
      return values.get(key) ?? null;
    },
    async setItem(key, value) {
      values.set(key, value);
    },
  };
}

describe('preference storage', () => {
  it('saves and reads all supported preferences', async () => {
    const storage = createMemoryBackend();

    await saveCompletedOnboarding(storage);
    await saveThemePreference(storage, 'dark');
    await saveLanguagePreference(storage, 'en');
    await saveLearningReminderEnabled(storage, true);
    await saveLearningReminderTime(storage, '19:30');

    await expect(readStoredPreferences(storage)).resolves.toEqual({
      hasCompletedOnboarding: true,
      languagePreference: 'en',
      learningReminderEnabled: true,
      learningReminderTime: '19:30',
      themePreference: 'dark',
    });
  });

  it('ignores invalid stored preference values', async () => {
    const storage = createMemoryBackend();

    await storage.setItem(PREFERENCE_STORAGE_KEYS.onboarding, 'false');
    await storage.setItem(PREFERENCE_STORAGE_KEYS.theme, 'sepia');
    await storage.setItem(PREFERENCE_STORAGE_KEYS.language, 'de');
    await storage.setItem(
      PREFERENCE_STORAGE_KEYS.learningReminderEnabled,
      'false',
    );
    await storage.setItem(
      PREFERENCE_STORAGE_KEYS.learningReminderTime,
      'evening',
    );

    await expect(readStoredPreferences(storage)).resolves.toEqual({
      hasCompletedOnboarding: false,
      languagePreference: undefined,
      learningReminderEnabled: false,
      learningReminderTime: undefined,
      themePreference: undefined,
    });
  });
});
