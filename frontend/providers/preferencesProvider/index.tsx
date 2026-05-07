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
import { useColorScheme as useSystemColorScheme } from 'react-native';
import i18n from '@/localization';
import type { LanguagePreference, ThemePreference } from './types';
import { saveThemePreference } from './preferenceStorage/saveThemePreference';
import { readStoredPreferences } from './preferenceStorage/readStoredPreferences';
import { saveCompletedOnboarding } from './preferenceStorage/saveCompletedOnboarding';
import { saveLanguagePreference } from './preferenceStorage/saveLanguagePreference';
export type { LanguagePreference, ThemePreference } from './types';

type PreferencesContextValue = {
  colorScheme: Exclude<ThemePreference, 'system'>;
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
    themePreference: 'system',
  });
  const systemColorScheme = useSystemColorScheme();

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
          themePreference: storedPreferences.themePreference ?? 'system',
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

  const colorScheme = useMemo<Exclude<ThemePreference, 'system'>>(() => {
    if (preferences.themePreference !== 'system') {
      return preferences.themePreference;
    }

    return systemColorScheme === 'dark' ? 'dark' : 'light';
  }, [preferences.themePreference, systemColorScheme]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      colorScheme,
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
      colorScheme,
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
