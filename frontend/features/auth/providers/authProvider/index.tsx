import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { refreshAuthSession } from '../../session/refreshAuthSession';
import { authSessionStore } from '../../session/authTokenStorage/authSessionStore';

import { type AuthUserProfile } from '../../types';

import { AUTH_STORAGE_KEYS } from './constants';
import { isJwtExpired } from './utils/isJwtExpired';
import { cancelQueriesOnSessionChange } from './utils/cancelQueriesOnSessionChange';
import { parseAuthUserProfile } from './utils/parseAuthUserProfile';

type SignInParams = {
  rememberMe: boolean;
  accessToken: string;
  refreshToken: string;
  userProfile: AuthUserProfile;
};

type AuthContextValue = {
  currentUser: AuthUserProfile | null;
  sessionVersion: number;
  isAuthenticated: boolean;
  isHydratingAuth: boolean;
  rememberMePreference: boolean;
  setRememberMePreference: (rememberMe: boolean) => Promise<void>;
  signIn: (params: SignInParams) => Promise<void>;
  signOut: () => Promise<void>;
};

type AuthProviderProps = {
  children: ReactNode;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Owns validated auth state and advances the screen-tree key on session invalidation.
 * Token refresh keeps the screen tree mounted. Login/logout replaces the key
 * so React Query disposes the old screens' per-call mutation subscriptions.
 * @param props - Application subtree receiving auth state and transition actions.
 * @returns Auth context; consumers must key the screen boundary by sessionVersion.
 * @example
 * <AuthProvider><App /></AuthProvider>
 * // Inside App: <Stack key={sessionVersion}>...</Stack>
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [sessionVersion, setSessionVersion] = useState(
    authSessionStore.version,
  );
  const [isHydratingAuth, setIsHydratingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<AuthUserProfile | null>(null);
  const isAuthenticated = currentUser !== null;
  const [rememberMePreference, setRememberMePreferenceState] = useState(false);

  useEffect(() => cancelQueriesOnSessionChange(queryClient), [queryClient]);

  useEffect(
    () =>
      authSessionStore.subscribe(() => {
        // Includes refresh rejection, which clears tokens outside signOut.
        setCurrentUser(null);
        setSessionVersion(authSessionStore.version);
      }),
    [],
  );

  useEffect(() => {
    let isActive = true;
    async function hydrateAuthState() {
      const hydrationVersion = authSessionStore.version;
      try {
        const [
          storedRememberMe,
          storedAccessToken,
          storedRefreshToken,
          storedUserProfile,
        ] = await Promise.all([
          AsyncStorage.getItem(AUTH_STORAGE_KEYS.rememberMe),
          AsyncStorage.getItem(AUTH_STORAGE_KEYS.accessToken),
          AsyncStorage.getItem(AUTH_STORAGE_KEYS.refreshToken),
          AsyncStorage.getItem(AUTH_STORAGE_KEYS.userProfile),
        ]);

        if (!isActive) return;
        authSessionStore.assertCurrent(hydrationVersion);
        const rememberMe = storedRememberMe === 'true';
        setRememberMePreferenceState(rememberMe);
        let storedProfile: unknown = null;
        if (storedUserProfile) {
          try {
            storedProfile = JSON.parse(storedUserProfile);
          } catch {
            // Malformed storage is handled like a missing profile below.
          }
        }
        const userProfile = parseAuthUserProfile(storedProfile);
        const hasValidStoredToken =
          Boolean(storedAccessToken) && !isJwtExpired(storedAccessToken);
        const refreshedSession =
          rememberMe &&
          userProfile &&
          !hasValidStoredToken &&
          storedRefreshToken
            ? await refreshAuthSession()
            : null;
        const isAuthenticatedAfterHydration =
          rememberMe &&
          userProfile !== null &&
          (hasValidStoredToken || Boolean(refreshedSession));
        if (!isActive) return;
        authSessionStore.assertCurrent(hydrationVersion);
        setCurrentUser(isAuthenticatedAfterHydration ? userProfile : null);

        if (!rememberMe || !isAuthenticatedAfterHydration) {
          await Promise.all([
            authSessionStore.clear(),
            AsyncStorage.removeItem(AUTH_STORAGE_KEYS.userProfile),
          ]);
        }
      } catch (error) {
        if (isActive && authSessionStore.version === hydrationVersion) {
          setCurrentUser(null);
          console.error('Failed to hydrate auth state', error);
        }
      } finally {
        if (isActive) setIsHydratingAuth(false);
      }
    }

    void hydrateAuthState();
    return () => {
      isActive = false;
    };
  }, []);

  const setRememberMePreference = useCallback(async (rememberMe: boolean) => {
    setRememberMePreferenceState(rememberMe);
    await AsyncStorage.setItem(
      AUTH_STORAGE_KEYS.rememberMe,
      String(rememberMe),
    );
  }, []);

  const signIn = useCallback(
    async ({
      rememberMe,
      accessToken,
      refreshToken,
      userProfile,
    }: SignInParams) => {
      const validatedUser = parseAuthUserProfile(userProfile);
      if (!validatedUser)
        throw new Error('Invalid authenticated user profile.');
      await setRememberMePreference(rememberMe);

      const tokenWrite = authSessionStore.replace({
        accessToken,
        refreshToken,
      });
      const signInVersion = authSessionStore.version;
      if (rememberMe) {
        const userProfileValue = JSON.stringify(validatedUser);

        await Promise.all([
          tokenWrite,
          AsyncStorage.setItem(AUTH_STORAGE_KEYS.userProfile, userProfileValue),
        ]);
      } else {
        await Promise.all([
          tokenWrite,
          AsyncStorage.removeItem(AUTH_STORAGE_KEYS.userProfile),
        ]);
      }

      authSessionStore.assertCurrent(signInVersion);
      setSessionVersion(signInVersion);
      setCurrentUser(validatedUser);
    },
    [setRememberMePreference],
  );

  const signOut = useCallback(async () => {
    const googleSignOutPromise = import('../../googleAuth')
      .then(({ signOutFromGoogle }) => signOutFromGoogle())
      .catch((error) => {
        console.warn('Failed to clear Google sign-in session', error);
      });

    await Promise.all([
      authSessionStore.clear(),
      AsyncStorage.removeItem(AUTH_STORAGE_KEYS.userProfile),
      googleSignOutPromise,
    ]);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      sessionVersion,
      isAuthenticated,
      isHydratingAuth,
      currentUser,
      rememberMePreference,
      setRememberMePreference,
      signIn,
      signOut,
    }),
    [
      sessionVersion,
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

/** Returns the validated user inside a root-protected private screen. */
export function useAuthenticatedUser(): AuthUserProfile {
  const { currentUser } = useAuth();
  if (!currentUser) {
    throw new Error('useAuthenticatedUser requires a private route.');
  }
  return currentUser;
}
