import { PREFERENCE_STORAGE_KEYS } from '../constants';
import { type PreferenceStorageBackend } from '../types';
import {
  type LanguagePreference,
  type LearningReminderTime,
  type ThemePreference,
} from '../../types';

type StoredPreferences = {
  hasCompletedOnboarding: boolean;
  languagePreference?: LanguagePreference;
  learningReminderEnabled: boolean;
  learningReminderTime?: LearningReminderTime;
  themePreference?: ThemePreference;
};

function parseLanguagePreference(
  value: string | null,
): LanguagePreference | undefined {
  return value === 'en' || value === 'uk' ? value : undefined;
}

function parseThemePreference(
  value: string | null,
): ThemePreference | undefined {
  return value === 'system' || value === 'light' || value === 'dark'
    ? value
    : undefined;
}

function parseLearningReminderTime(
  value: string | null,
): LearningReminderTime | undefined {
  if (!value) {
    return undefined;
  }

  return /^\d{2}:\d{2}$/.test(value)
    ? (value as LearningReminderTime)
    : undefined;
}

/**
 * Load persisted preferences and parse supported values for provider initialization.
 *
 * Reads storage concurrently. Reminder times are checked for the HH:mm shape only; numeric
 * hour and minute ranges are not validated.
 *
 * @param storage - Storage backend providing asynchronous reads by preference key.
 * @returns Parsed preferences: missing or invalid theme/language/time values are undefined,
 *   boolean flags default to false. Storage failures propagate.
 * @example
 * await readStoredPreferences({ getItem: async () => null, setItem: async () => {} });
 * // => { hasCompletedOnboarding: false, languagePreference: undefined, learningReminderEnabled: false, learningReminderTime: undefined, themePreference: undefined }
 */
export async function readStoredPreferences(
  storage: PreferenceStorageBackend,
): Promise<StoredPreferences> {
  const [
    storedOnboarding,
    storedThemePreference,
    storedLanguagePreference,
    storedReminderEnabled,
    storedReminderTime,
  ] = await Promise.all([
    storage.getItem(PREFERENCE_STORAGE_KEYS.onboarding),
    storage.getItem(PREFERENCE_STORAGE_KEYS.theme),
    storage.getItem(PREFERENCE_STORAGE_KEYS.language),
    storage.getItem(PREFERENCE_STORAGE_KEYS.learningReminderEnabled),
    storage.getItem(PREFERENCE_STORAGE_KEYS.learningReminderTime),
  ]);

  return {
    hasCompletedOnboarding: storedOnboarding === 'true',
    languagePreference: parseLanguagePreference(storedLanguagePreference),
    learningReminderEnabled: storedReminderEnabled === 'true',
    learningReminderTime: parseLearningReminderTime(storedReminderTime),
    themePreference: parseThemePreference(storedThemePreference),
  };
}
