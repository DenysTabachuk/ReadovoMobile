import { PreferenceStorageBackend, PREFERENCE_STORAGE_KEYS } from "../constants";
import { LanguagePreference, ThemePreference } from "../..";

type StoredPreferences = {
  hasCompletedOnboarding: boolean;
  languagePreference?: LanguagePreference;
  themePreference?: ThemePreference;
};

function parseLanguagePreference(
  value: string | null,
): LanguagePreference | undefined {
  return value === 'en' || value === 'uk' ? value : undefined;
}

function parseThemePreference(value: string | null): ThemePreference | undefined {
  return value === 'system' || value === 'light' || value === 'dark'
    ? value
    : undefined;
}


// Reads user preferences from persistent storage
//  and maps raw stored values into validated application settings 
// (onboarding status, theme, and language).
//  Falls back to safe defaults when stored values are missing or invalid.
export async function readStoredPreferences(
    storage: PreferenceStorageBackend,
): Promise<StoredPreferences> {
    const [
        storedOnboarding,
        storedThemePreference,
        storedLanguagePreference,
    ] = await Promise.all([
        storage.getItem(PREFERENCE_STORAGE_KEYS.onboarding),
        storage.getItem(PREFERENCE_STORAGE_KEYS.theme),
        storage.getItem(PREFERENCE_STORAGE_KEYS.language),
    ]);

    return {
        hasCompletedOnboarding: storedOnboarding === 'true',
        languagePreference: parseLanguagePreference(storedLanguagePreference),
        themePreference: parseThemePreference(storedThemePreference),
    };
}
