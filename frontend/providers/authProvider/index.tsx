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

import {
  AUTH_ACCESS_TOKEN_STORAGE_KEY,
  AUTH_REFRESH_TOKEN_STORAGE_KEY,
  clearAuthTokens,
  persistAuthTokens,
  refreshAuthSession,
} from '@/api/auth/authenticatedFetch';

type AuthContextValue = {
  currentUser: AuthUserProfile | null;
  isAuthenticated: boolean;
  isHydratingAuth: boolean;
  rememberMePreference: boolean;
  setRememberMePreference: (rememberMe: boolean) => Promise<void>;
  signIn: (
    rememberMe: boolean,
    accessToken: string,
    refreshToken: string,
    userProfile?: AuthUserProfile | null,
  ) => Promise<void>;
  signOut: () => Promise<void>;
};

export type AuthUserProfile = {
  displayName: string | null;
  email: string | null;
  id: string | null;
};

type AuthProviderProps = {
  children: ReactNode;
};

const AUTH_STORAGE_KEYS = {
  accessToken: AUTH_ACCESS_TOKEN_STORAGE_KEY,
  refreshToken: AUTH_REFRESH_TOKEN_STORAGE_KEY,
  rememberMe: 'readovo.auth.rememberMe',
  userProfile: 'readovo.auth.userProfile',
} as const;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [isHydratingAuth, setIsHydratingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUserProfile | null>(null);
  const [rememberMePreference, setRememberMePreferenceState] = useState(false);

  useEffect(() => {
    async function hydrateAuthState() {
      try {
        const [storedRememberMe, storedAccessToken, storedRefreshToken, storedUserProfile] = await Promise.all([
          AsyncStorage.getItem(AUTH_STORAGE_KEYS.rememberMe),
          AsyncStorage.getItem(AUTH_STORAGE_KEYS.accessToken),
          AsyncStorage.getItem(AUTH_STORAGE_KEYS.refreshToken),
          AsyncStorage.getItem(AUTH_STORAGE_KEYS.userProfile),
        ]);

        const rememberMe = storedRememberMe === 'true';
        const hasValidStoredToken = Boolean(storedAccessToken) && !isJwtExpired(storedAccessToken);
        const refreshedSession =
          rememberMe && !hasValidStoredToken && storedRefreshToken
            ? await refreshAuthSession()
            : null;
        const isAuthenticatedAfterHydration =
          rememberMe && (hasValidStoredToken || Boolean(refreshedSession));
        setRememberMePreferenceState(rememberMe);
        setIsAuthenticated(isAuthenticatedAfterHydration);
        setCurrentUser(
          isAuthenticatedAfterHydration && storedUserProfile
            ? (JSON.parse(storedUserProfile) as AuthUserProfile)
            : null,
        );

        if (!rememberMe || !isAuthenticatedAfterHydration) {
          await Promise.all([
            clearAuthTokens(),
            AsyncStorage.removeItem(AUTH_STORAGE_KEYS.userProfile),
          ]);
        }
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
    async (
      rememberMe: boolean,
      accessToken: string,
      refreshToken: string,
      userProfile: AuthUserProfile | null = null,
    ) => {
      await setRememberMePreference(rememberMe);

      if (rememberMe) {
        const userProfileValue = userProfile ? JSON.stringify(userProfile) : '';

        await Promise.all([
          persistAuthTokens({ accessToken, refreshToken }),
          AsyncStorage.setItem(AUTH_STORAGE_KEYS.userProfile, userProfileValue),
        ]);
      } else {
        await Promise.all([
          persistAuthTokens({ accessToken, refreshToken }),
          AsyncStorage.removeItem(AUTH_STORAGE_KEYS.userProfile),
        ]);
      }

      setCurrentUser(userProfile);
      setIsAuthenticated(true);
    },
    [setRememberMePreference],
  );

  const signOut = useCallback(async () => {
    const  googleSignOutPromise= import('@/auth/googleAuth')
      .then(({ signOutFromGoogle }) => signOutFromGoogle())
      .catch((error) => {
        console.warn('Failed to clear Google sign-in session', error);
      });

    await Promise.all([
      clearAuthTokens(),
      AsyncStorage.removeItem(AUTH_STORAGE_KEYS.userProfile),
      googleSignOutPromise,
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

function isJwtExpired(token: string | null): boolean {
  if (!token) {
    return true;
  }

  try {
    const [, encodedPayload] = token.split('.');
    const payload = JSON.parse(atob(encodedPayload ?? '')) as { exp?: number };

    return typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}
