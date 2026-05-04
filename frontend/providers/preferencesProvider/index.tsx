import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import i18n from '@/localization';
import type { LanguagePreference, ThemePreference } from './types';
import { saveThemePreference } from './preferenceStorage/saveThemePreference';
import { readStoredPreferences } from './preferenceStorage/readStoredPreferences';
import { saveCompletedOnboarding } from './preferenceStorage/saveCompletedOnboarding';
import { saveLanguagePreference } from './preferenceStorage/saveLanguagePreference';
export type { LanguagePreference, ThemePreference } from './types';

type PreferencesContextValue = {
  colorScheme: ThemePreference;
  hasCompletedOnboarding: boolean;
  languagePreference: LanguagePreference;
  themePreference: ThemePreference;
  isLoadingPreferences: boolean;
  completeOnboarding: () => Promise<void>;
  setLanguagePreference: (languagePreference: LanguagePreference) => Promise<void>;
  setThemePreference: (themePreference: ThemePreference) => Promise<void>;
};

const PreferencesContext = createContext<PreferencesContextValue | undefined>(
  undefined,
);

type PreferencesProviderProps = {
  children: ReactNode;
};

type StoredPreferencesState = {
  hasCompletedOnboarding: boolean;
  languagePreference: LanguagePreference;
  themePreference: ThemePreference;
};

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<StoredPreferencesState>({
    hasCompletedOnboarding: false,
    languagePreference: 'en',
    themePreference: 'light',
  });

  useEffect(() => {
    async function initializePreferences() {
      try {
        const storedPreferences = await readStoredPreferences(AsyncStorage);

        if (storedPreferences.languagePreference) {
          await i18n.changeLanguage(storedPreferences.languagePreference);
        }

        setPreferences({
          hasCompletedOnboarding: storedPreferences.hasCompletedOnboarding,
          languagePreference: storedPreferences.languagePreference ?? 'en',
          themePreference: storedPreferences.themePreference ?? 'light',
        });
      } catch (error) {
        console.error('Failed to initialize preferences', error);
      } finally {
        setIsLoading(false);
      }
    }

    void initializePreferences();
  }, []);

  const completeOnboarding = useCallback(async () => {
    await saveCompletedOnboarding(AsyncStorage);
    setPreferences((previous) => ({
      ...previous,
      hasCompletedOnboarding: true,
    }));
  }, []);

  const setLanguagePreference = useCallback(
    async (languagePreference: LanguagePreference) => {
      await i18n.changeLanguage(languagePreference);
      await saveLanguagePreference(AsyncStorage, languagePreference);
      setPreferences((previous) => ({
        ...previous,
        languagePreference,
      }));
    },
    [],
  );

  const setThemePreference = useCallback(async (themePreference: ThemePreference) => {
    await saveThemePreference(AsyncStorage, themePreference);
    setPreferences((previous) => ({
      ...previous,
      themePreference,
    }));
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      colorScheme: preferences.themePreference,
      hasCompletedOnboarding: preferences.hasCompletedOnboarding,
      languagePreference: preferences.languagePreference,
      themePreference: preferences.themePreference,
      isLoadingPreferences: isLoading,
      completeOnboarding,
      setLanguagePreference,
      setThemePreference,
    }),
    [
      completeOnboarding,
      isLoading,
      preferences.hasCompletedOnboarding,
      preferences.languagePreference,
      preferences.themePreference,
      setLanguagePreference,
      setThemePreference,
    ],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const preferences = useContext(PreferencesContext);

  if (!preferences) {
    throw new Error('usePreferences must be used within PreferencesProvider.');
  }

  return preferences;
}
