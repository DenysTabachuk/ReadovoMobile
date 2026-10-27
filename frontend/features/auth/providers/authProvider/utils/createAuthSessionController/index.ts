import { authSessionStore } from '../../../../session/authTokenStorage/authSessionStore';
import { refreshAuthSession } from '../../../../session/refreshAuthSession';
import { createAuthSessionClient } from '../../../../session/utils/createAuthSessionClient';
import { getSessionOwner } from '../../../../session/utils/getSessionOwner';
import type { AuthSessionClient, AuthTokens } from '../../../../session/types';
import type { AuthUserProfile } from '../../../../types';
import { AUTH_STORAGE_KEYS } from '../../constants';
import { isJwtExpired } from '../isJwtExpired';

type ControllerStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

type AuthState = {
  session: AuthSessionClient | null;
  currentUser: AuthUserProfile | null;
  isAuthenticated: boolean;
  isHydratingAuth: boolean;
  rememberMePreference: boolean;
};

type SignInParams = {
  rememberMe: boolean;
  tokens: AuthTokens;
  userProfile?: AuthUserProfile | null;
};

/**
 * Coordinates provider state and serialized profile/preferences with token sessions.
 * @param storage - Profile/preference storage; tokens use the session store.
 * @returns Observable auth state and hydration/sign-in/sign-out actions.
 * Transitions invalidate synchronously; stale completions cannot publish state.
 * Dispose the store subscription when the controller's owning lifetime ends.
 * @example
 * const auth = createAuthSessionController(storage);
 * await auth.signIn({ rememberMe: true, tokens });
 * // auth.getSnapshot().session owns the validated token subject.
 */
export function createAuthSessionController(storage: ControllerStorage) {
  let state: AuthState = {
    session: null,
    currentUser: null,
    isAuthenticated: false,
    isHydratingAuth: true,
    rememberMePreference: false,
  };
  const listeners = new Set<() => void>();
  let pendingMetadata: Promise<void> = Promise.resolve();
  let hydration: Promise<void> | undefined;

  function publish(next: AuthState) {
    state = next;
    listeners.forEach((listener) => listener());
  }

  const dispose = authSessionStore.subscribe(() => {
    publish({
      ...state,
      session: null,
      currentUser: null,
      isAuthenticated: false,
      isHydratingAuth: false,
    });
  });

  function enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = pendingMetadata.then(operation);
    pendingMetadata = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  function establish(
    accessToken: string | null,
    profile: AuthUserProfile | null,
    version: number,
  ) {
    authSessionStore.assertCurrent(version);
    const ownerId = getSessionOwner(accessToken);
    if (profile && profile.id !== ownerId)
      throw new Error('Authentication profile owner mismatch.');
    const currentUser = profile ?? {
      id: ownerId,
      displayName: null,
      email: null,
    };
    const session = createAuthSessionClient({ ownerId, version });
    return { session, currentUser };
  }

  async function clearFailedTransition(version: number): Promise<void> {
    if (authSessionStore.version !== version) return;
    const clearedVersion = version + 1;
    const cleared = authSessionStore.clear();
    await cleared;
    if (authSessionStore.version === clearedVersion) {
      await storage.removeItem(AUTH_STORAGE_KEYS.userProfile);
    }
  }

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose,
    hydrate(): Promise<void> {
      if (hydration) return hydration;
      if (!state.isHydratingAuth) return Promise.resolve();
      const version = authSessionStore.version;
      hydration = (async () => {
        try {
          authSessionStore.assertCurrent(version);
          const [[rememberValue, profileValue], tokens] = await Promise.all([
            enqueue(() =>
              Promise.all([
                storage.getItem(AUTH_STORAGE_KEYS.rememberMe),
                storage.getItem(AUTH_STORAGE_KEYS.userProfile),
              ]),
            ),
            authSessionStore.read(version),
          ]);
          authSessionStore.assertCurrent(version);
          const rememberMe = rememberValue === 'true';
          publish({ ...state, rememberMePreference: rememberMe });
          if (!rememberMe) {
            await enqueue(() => clearFailedTransition(version));
            return;
          }
          // Network refresh must not hold the metadata queue and block a new login.
          const accessToken = isJwtExpired(tokens.accessToken)
            ? ((await refreshAuthSession(version))?.accessToken ?? null)
            : tokens.accessToken;
          authSessionStore.assertCurrent(version);
          const profile = profileValue
            ? (JSON.parse(profileValue) as AuthUserProfile)
            : null;
          const identity = establish(accessToken, profile, version);
          publish({
            ...state,
            ...identity,
            isAuthenticated: true,
            isHydratingAuth: false,
          });
        } catch (error) {
          authSessionStore.assertCurrent(version);
          await enqueue(() => clearFailedTransition(version));
          throw error;
        } finally {
          if (authSessionStore.version === version)
            publish({ ...state, isHydratingAuth: false });
        }
      })();
      return hydration;
    },
    signIn({
      rememberMe,
      tokens,
      userProfile = null,
    }: SignInParams): Promise<void> {
      // Invalidate before preference/profile I/O, even for a fresh login as the same owner.
      const version = authSessionStore.version + 1;
      const persisted = authSessionStore.replace(tokens);
      // Observe early failure while an older metadata operation is still pending.
      void persisted.catch(() => undefined);
      return enqueue(async () => {
        try {
          await persisted;
          authSessionStore.assertCurrent(version);
          const identity = establish(tokens.accessToken, userProfile, version);
          await storage.setItem(
            AUTH_STORAGE_KEYS.rememberMe,
            String(rememberMe),
          );
          authSessionStore.assertCurrent(version);
          if (rememberMe && userProfile) {
            await storage.setItem(
              AUTH_STORAGE_KEYS.userProfile,
              JSON.stringify(userProfile),
            );
          } else {
            await storage.removeItem(AUTH_STORAGE_KEYS.userProfile);
          }
          authSessionStore.assertCurrent(version);
          publish({
            ...state,
            ...identity,
            rememberMePreference: rememberMe,
            isAuthenticated: true,
            isHydratingAuth: false,
          });
        } catch (error) {
          authSessionStore.assertCurrent(version);
          await clearFailedTransition(version);
          throw error;
        }
      });
    },
    signOut(): Promise<void> {
      const version = authSessionStore.version + 1;
      const cleared = authSessionStore.clear();
      void cleared.catch(() => undefined);
      return enqueue(async () => {
        // Complete profile cleanup even when token removal failed.
        const results = await Promise.allSettled([
          cleared,
          authSessionStore.version === version
            ? storage.removeItem(AUTH_STORAGE_KEYS.userProfile)
            : Promise.resolve(),
        ]);
        const failure = results.find((result) => result.status === 'rejected');
        if (failure?.status === 'rejected') throw failure.reason;
      });
    },
    setRememberMePreference(rememberMe: boolean): Promise<void> {
      const version = authSessionStore.version;
      return enqueue(async () => {
        authSessionStore.assertCurrent(version);
        await storage.setItem(AUTH_STORAGE_KEYS.rememberMe, String(rememberMe));
        authSessionStore.assertCurrent(version);
        publish({ ...state, rememberMePreference: rememberMe });
      });
    },
  };
}
