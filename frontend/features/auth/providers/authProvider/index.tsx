import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useSyncExternalStore,
} from 'react';

import type { AuthUserProfile } from '../../types';
import { signOutFromGoogle } from '../../googleAuth';
import { createAuthSessionController } from './utils/createAuthSessionController';

type AuthContextValue = ReturnType<typeof controller.getSnapshot> & {
  setRememberMePreference: (rememberMe: boolean) => Promise<void>;
  signIn: (
    rememberMe: boolean,
    accessToken: string,
    refreshToken: string,
    userProfile?: AuthUserProfile | null,
  ) => Promise<void>;
  signOut: () => Promise<void>;
};

type AuthProviderProps = {
  children: ReactNode;
};

// Auth and its token store share the application lifetime, including provider remounts.
const controller = createAuthSessionController(AsyncStorage);
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const signIn: AuthContextValue['signIn'] = (
  rememberMe,
  accessToken,
  refreshToken,
  userProfile,
) =>
  controller.signIn({
    rememberMe,
    tokens: { accessToken, refreshToken },
    userProfile,
  });

const signOut = async () => {
  const cleared = controller.signOut();
  const googleSignOut = signOutFromGoogle().catch((error) =>
    console.warn('Failed to clear Google sign-in session', error),
  );
  await Promise.all([cleared, googleSignOut]);
};

export function AuthProvider({ children }: AuthProviderProps) {
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );

  useEffect(() => {
    void controller.hydrate().catch((error) => {
      if (!(error instanceof Error && error.name === 'AbortError')) {
        console.error('Failed to hydrate auth state', error);
      }
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signOut,
        setRememberMePreference: controller.setRememberMePreference,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used within AuthProvider.');
  return auth;
}
