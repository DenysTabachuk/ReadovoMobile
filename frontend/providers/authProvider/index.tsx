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

type AuthContextValue = {
  isAuthenticated: boolean;
  isHydratingAuth: boolean;
  rememberMePreference: boolean;
  setRememberMePreference: (rememberMe: boolean) => Promise<void>;
  signIn: (rememberMe: boolean) => Promise<void>;
  signOut: () => Promise<void>;
};

type AuthProviderProps = {
  children: ReactNode;
};

const AUTH_STORAGE_KEYS = {
  rememberMe: 'speakly.auth.rememberMe',
  session: 'speakly.auth.session',
} as const;

const AUTH_SESSION_VALUE = 'authenticated';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [isHydratingAuth, setIsHydratingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [rememberMePreference, setRememberMePreferenceState] = useState(false);

  useEffect(() => {
    async function hydrateAuthState() {
      try {
        const [storedRememberMe, storedSession] = await Promise.all([
          AsyncStorage.getItem(AUTH_STORAGE_KEYS.rememberMe),
          AsyncStorage.getItem(AUTH_STORAGE_KEYS.session),
        ]);

        const rememberMe = storedRememberMe === 'true';
        setRememberMePreferenceState(rememberMe);
        setIsAuthenticated(rememberMe && storedSession === AUTH_SESSION_VALUE);
      } catch (error) {
        console.error('Failed to hydrate auth state', error);
      } finally {
        setIsHydratingAuth(false);
      }
    }

    void hydrateAuthState();
  }, []);

  const setRememberMePreference = useCallback(async (rememberMe: boolean) => {
    setRememberMePreferenceState(rememberMe);
    await AsyncStorage.setItem(AUTH_STORAGE_KEYS.rememberMe, String(rememberMe));
  }, []);

  const signIn = useCallback(
    async (rememberMe: boolean) => {
      await setRememberMePreference(rememberMe);

      if (rememberMe) {
        await AsyncStorage.setItem(AUTH_STORAGE_KEYS.session, AUTH_SESSION_VALUE);
      } else {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.session);
      }

      setIsAuthenticated(true);
    },
    [setRememberMePreference],
  );

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.session);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isHydratingAuth,
      rememberMePreference,
      setRememberMePreference,
      signIn,
      signOut,
    }),
    [
      isAuthenticated,
      isHydratingAuth,
      rememberMePreference,
      setRememberMePreference,
      signIn,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return auth;
}
