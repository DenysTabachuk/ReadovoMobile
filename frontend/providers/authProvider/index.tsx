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
  currentUser: AuthUserProfile | null;
  isAuthenticated: boolean;
  isHydratingAuth: boolean;
  rememberMePreference: boolean;
  setRememberMePreference: (rememberMe: boolean) => Promise<void>;
  signIn: (rememberMe: boolean, userProfile?: AuthUserProfile | null) => Promise<void>;
  signOut: () => Promise<void>;
};

export type AuthUserProfile = {
  displayName: string | null;
  email: string | null;
};

type AuthProviderProps = {
  children: ReactNode;
};

const AUTH_STORAGE_KEYS = {
  rememberMe: 'speakly.auth.rememberMe',
  session: 'speakly.auth.session',
  userProfile: 'speakly.auth.userProfile',
} as const;

const AUTH_SESSION_VALUE = 'authenticated';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [isHydratingAuth, setIsHydratingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUserProfile | null>(null);
  const [rememberMePreference, setRememberMePreferenceState] = useState(false);

  useEffect(() => {
    async function hydrateAuthState() {
      try {
        const [storedRememberMe, storedSession, storedUserProfile] = await Promise.all([
          AsyncStorage.getItem(AUTH_STORAGE_KEYS.rememberMe),
          AsyncStorage.getItem(AUTH_STORAGE_KEYS.session),
          AsyncStorage.getItem(AUTH_STORAGE_KEYS.userProfile),
        ]);

        const rememberMe = storedRememberMe === 'true';
        setRememberMePreferenceState(rememberMe);
        setIsAuthenticated(rememberMe && storedSession === AUTH_SESSION_VALUE);
        setCurrentUser(storedUserProfile ? (JSON.parse(storedUserProfile) as AuthUserProfile) : null);
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
    async (rememberMe: boolean, userProfile: AuthUserProfile | null = null) => {
      await setRememberMePreference(rememberMe);

      if (rememberMe) {
        const userProfileValue = userProfile ? JSON.stringify(userProfile) : '';

        await Promise.all([
          AsyncStorage.setItem(AUTH_STORAGE_KEYS.session, AUTH_SESSION_VALUE),
          AsyncStorage.setItem(AUTH_STORAGE_KEYS.userProfile, userProfileValue),
        ]);
      } else {
        await Promise.all([
          AsyncStorage.removeItem(AUTH_STORAGE_KEYS.session),
          AsyncStorage.removeItem(AUTH_STORAGE_KEYS.userProfile),
        ]);
      }

      setCurrentUser(userProfile);
      setIsAuthenticated(true);
    },
    [setRememberMePreference],
  );

  const signOut = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(AUTH_STORAGE_KEYS.session),
      AsyncStorage.removeItem(AUTH_STORAGE_KEYS.userProfile),
    ]);
    setCurrentUser(null);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isHydratingAuth,
      currentUser,
      rememberMePreference,
      setRememberMePreference,
      signIn,
      signOut,
    }),
    [
      isAuthenticated,
      isHydratingAuth,
      currentUser,
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
