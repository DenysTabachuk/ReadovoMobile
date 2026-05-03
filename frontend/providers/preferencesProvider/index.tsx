import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  useColorScheme as useSystemColorScheme,
  type ColorSchemeName,
} from 'react-native';

export type ThemePreference = 'light' | 'dark';

type PreferencesContextValue = {
  colorScheme: NonNullable<ColorSchemeName>;
  setThemePreference: (themePreference: ThemePreference) => void;
  themePreference: ThemePreference;
};

const PreferencesContext = createContext<PreferencesContextValue | undefined>(
  undefined,
);

type PreferencesProviderProps = {
  children: ReactNode;
};

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const systemColorScheme = useSystemColorScheme() ?? 'light';
  const [themePreference, setThemePreference] =
    useState<ThemePreference>(systemColorScheme);
  const colorScheme = themePreference;
  const value = useMemo(
    () => ({
      colorScheme,
      setThemePreference,
      themePreference,
    }),
    [colorScheme, themePreference],
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
