import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import i18n from '@/localization';
import {
  DEFAULT_LANGUAGE_PREFERENCE,
  DEFAULT_LEARNING_REMINDER_TIME,
  DEFAULT_THEME_PREFERENCE,
} from './constants';
import type {
  LanguagePreference,
  LearningReminderTime,
  ThemePreference,
} from './types';
import { saveThemePreference } from './preferenceStorage/saveThemePreference';
import { readStoredPreferences } from './preferenceStorage/readStoredPreferences';
import { saveCompletedOnboarding } from './preferenceStorage/saveCompletedOnboarding';
import { saveLanguagePreference } from './preferenceStorage/saveLanguagePreference';
import { saveLearningReminderEnabled } from './preferenceStorage/saveLearningReminderEnabled';
import { saveLearningReminderTime } from './preferenceStorage/saveLearningReminderTime';
export type {
  LanguagePreference,
  LearningReminderTime,
  ThemePreference,
} from './types';

export { DEFAULT_LEARNING_REMINDER_TIME } from './constants';

type PreferencesContextValue = {
  colorScheme: Exclude<ThemePreference, 'system'>;
  hasCompletedOnboarding: boolean;
  languagePreference: LanguagePreference;
  learningReminderEnabled: boolean;
  learningReminderTime: LearningReminderTime;
  themePreference: ThemePreference;
  isLoadingPreferences: boolean;
  isSavingThemePreference: boolean;
  completeOnboarding: () => Promise<void>;
  hydrateLearningReminderPreferences: (input: {
    learningReminderTime: LearningReminderTime;
    learningRemindersEnabled: boolean;
  }) => void;
  setLearningReminderEnabled: (enabled: boolean) => Promise<void>;
  setLearningReminderTime: (time: LearningReminderTime) => Promise<void>;
  setLanguagePreference: (
    languagePreference: LanguagePreference,
  ) => Promise<void>;
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
  learningReminderEnabled: boolean;
  learningReminderTime: LearningReminderTime;
  themePreference: ThemePreference;
};

/**
 * Hydrates application preferences and resolves explicit/system appearance.
 * Only successful theme writes change the committed selection. While a save is
 * pending, further selections are ignored; controls should be disabled. Callers
 * must handle rejected setters and own the lifetime of any UI feedback.
 * @param props - Children sharing this preference lifetime.
 * @returns Preference context; pending theme writes are exposed to consumers.
 * @example
 * // A child can await setThemePreference('system'); after success the UI follows OS changes.
 */
export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<StoredPreferencesState>({
    hasCompletedOnboarding: false,
    languagePreference: DEFAULT_LANGUAGE_PREFERENCE,
    learningReminderEnabled: false,
    learningReminderTime: DEFAULT_LEARNING_REMINDER_TIME,
    themePreference: DEFAULT_THEME_PREFERENCE,
  });
  const systemColorScheme = useSystemColorScheme();
  const themeSaveInProgress = useRef(false);
  const [isSavingThemePreference, setIsSavingThemePreference] = useState(false);

  useEffect(() => {
    async function initializePreferences() {
      try {
        const storedPreferences = await readStoredPreferences(AsyncStorage);

        if (storedPreferences.languagePreference) {
          await i18n.changeLanguage(storedPreferences.languagePreference);
        }

        setPreferences({
          hasCompletedOnboarding: storedPreferences.hasCompletedOnboarding,
          languagePreference:
            storedPreferences.languagePreference ?? DEFAULT_LANGUAGE_PREFERENCE,
          learningReminderEnabled: storedPreferences.learningReminderEnabled,
          learningReminderTime:
            storedPreferences.learningReminderTime ??
            DEFAULT_LEARNING_REMINDER_TIME,
          themePreference:
            storedPreferences.themePreference ?? DEFAULT_THEME_PREFERENCE,
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

  const setThemePreference = useCallback(
    async (themePreference: ThemePreference) => {
      // Ignore taps arriving before React renders the disabled control.
      if (themeSaveInProgress.current) return;
      themeSaveInProgress.current = true;
      setIsSavingThemePreference(true);
      try {
        await saveThemePreference(AsyncStorage, themePreference);
        setPreferences((previous) => ({ ...previous, themePreference }));
      } finally {
        themeSaveInProgress.current = false;
        setIsSavingThemePreference(false);
      }
    },
    [],
  );

  const setLearningReminderEnabled = useCallback(async (enabled: boolean) => {
    await saveLearningReminderEnabled(AsyncStorage, enabled);
    setPreferences((previous) => ({
      ...previous,
      learningReminderEnabled: enabled,
    }));
  }, []);

  const setLearningReminderTime = useCallback(
    async (time: LearningReminderTime) => {
      await saveLearningReminderTime(AsyncStorage, time);
      setPreferences((previous) => ({
        ...previous,
        learningReminderTime: time,
      }));
    },
    [],
  );

  const hydrateLearningReminderPreferences = useCallback(
    (input: {
      learningReminderTime: LearningReminderTime;
      learningRemindersEnabled: boolean;
    }) => {
      setPreferences((previous) => ({
        ...previous,
        learningReminderEnabled: input.learningRemindersEnabled,
        learningReminderTime: input.learningReminderTime,
      }));
    },
    [],
  );

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
      learningReminderEnabled: preferences.learningReminderEnabled,
      learningReminderTime: preferences.learningReminderTime,
      themePreference: preferences.themePreference,
      isLoadingPreferences: isLoading,
      isSavingThemePreference,
      completeOnboarding,
      hydrateLearningReminderPreferences,
      setLearningReminderEnabled,
      setLearningReminderTime,
      setLanguagePreference,
      setThemePreference,
    }),
    [
      completeOnboarding,
      hydrateLearningReminderPreferences,
      colorScheme,
      isLoading,
      isSavingThemePreference,
      preferences.hasCompletedOnboarding,
      preferences.languagePreference,
      preferences.learningReminderEnabled,
      preferences.learningReminderTime,
      preferences.themePreference,
      setLearningReminderEnabled,
      setLearningReminderTime,
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
