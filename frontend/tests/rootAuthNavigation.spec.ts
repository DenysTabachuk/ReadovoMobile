import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  act,
  createElement,
  Fragment,
  useState,
  type PropsWithChildren,
} from 'react';
import { createRoot, type Root } from 'test-renderer';
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
} from '@tanstack/react-query';
import {
  StackRouter,
  StackActions,
  CommonActions,
} from '@react-navigation/routers';
import { useFilterScreenChildren } from 'expo-router/build/layouts/withLayoutContext';
import { Screen } from 'expo-router/build/views/Screen';
import { Protected } from 'expo-router/build/views/Protected';
import RootLayout from '@/app/_layout';
import IndexScreen from '@/app/index';
import { StartScreen } from '@/features/onboarding';
import { Redirect } from 'expo-router';

type NavigationAuthState = {
  isAuthenticated: boolean;
  currentUser: typeof USER | null;
  sessionVersion: number;
  isHydratingAuth: boolean;
};

// Keep Expo's actual Protected element detection/filter and React Navigation's
// actual state transitions. Native rendering and application services are replaced.
jest.mock('expo-router/build/Route', () => ({}));
jest.mock('expo-router/build/useScreens', () => ({}));
jest.mock(
  'expo-router/build/native-tabs/NativeBottomTabs/NativeTabTrigger',
  () => ({
    isNativeTabTrigger: () => false,
  }),
);
jest.mock('expo-router/build/primitives', () => ({ Group: () => null }));
jest.mock('expo-router/build/useNavigation', () => ({}));
jest.mock('expo-router/build/views/useSafeLayoutEffect', () => ({}));
jest.mock('expo-router/build/utils/stack', () => ({}));
jest.mock('@react-navigation/native', () => ({
  ThemeProvider: ({ children }: PropsWithChildren) => children,
  DarkTheme: {},
  DefaultTheme: {},
}));
jest.mock('@/features/onboarding', () => ({ StartScreen: () => null }));
jest.mock('expo-router', () => ({
  Redirect: () => null,
  Stack: Object.assign(
    (props: PropsWithChildren) => createElement(MockStack, props),
    { Screen, Protected },
  ),
}));
jest.mock('react-native', () => ({
  View: 'View',
  Platform: { OS: 'ios', select: () => ({}) },
  AppState: { addEventListener: () => ({ remove: jest.fn() }) },
}));
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: 'GestureHandlerRootView',
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: 'SafeAreaProvider',
}));
jest.mock('react-native-reanimated', () => ({}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-navigation-bar', () => ({}));
jest.mock('expo-system-ui', () => ({ setBackgroundColorAsync: jest.fn() }));
jest.mock('expo-notifications', () => ({ setNotificationHandler: jest.fn() }));
jest.mock('@/localization', () => ({}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('@/devtools/reactotron', () => ({}));
jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'light',
}));
jest.mock('@/components/fullScreenLoader', () => ({
  FullScreenLoader: () => createElement('div', { id: 'auth-loader' }),
}));
jest.mock('@/components/banner', () => ({
  BannerProvider: ({ children }: PropsWithChildren) => children,
}));
jest.mock('@/features/learningReminders/service', () => ({
  loadLearningReminderPreferences: jest.fn(async () => ({})),
  syncLearningReminder: jest.fn(),
}));
jest.mock('@/features/auth', () => ({
  AuthProvider: ({ children }: PropsWithChildren) => children,
  useAuth: () => mockAuth,
}));
jest.mock('@/providers/preferencesProvider', () => ({
  PreferencesProvider: ({ children }: PropsWithChildren) => children,
  usePreferences: () => ({
    isLoadingPreferences: mockLoadingPreferences,
    hasCompletedOnboarding: mockCompletedOnboarding,
  }),
}));
jest.mock('@/providers/queryProvider', () => ({
  QueryProvider: ({ children }: PropsWithChildren) =>
    createElement(QueryClientProvider, { client: mockClient }, children),
}));

const router = StackRouter({});
const USER = { id: 'reader-a', email: null, displayName: null };
let mockAuth: NavigationAuthState = {
  isAuthenticated: false,
  currentUser: null,
  sessionVersion: 0,
  isHydratingAuth: false,
};
let mockLoadingPreferences = false;
let mockCompletedOnboarding = false;
let mockInitialRoute = 'index';
let mockClient: QueryClient;
let renderer: Root | undefined;
let routeNames: string[] = [];
let activeRoute: string | undefined;
let navigationState: ReturnType<typeof router.getInitialState> | undefined;
let dispatch: (action: Parameters<typeof router.getStateForAction>[1]) => void;
let startMutation: () => void;
let finishMutation: () => void;
const screenFeedback = jest.fn();
const dataCompletion = jest.fn();
let privateMounts = 0;

function PrivateScreen() {
  const [identity] = useState(() => ++privateMounts);
  const mutation = useMutation({
    mutationFn: () =>
      new Promise<void>((resolve) => {
        finishMutation = resolve;
      }),
    onSuccess: dataCompletion,
  });
  startMutation = () =>
    mutation.mutate(undefined, { onSuccess: screenFeedback });
  return createElement('PrivateScreen', { identity });
}

function MockStack({ children }: PropsWithChildren) {
  const filtered = useFilterScreenChildren(children);
  routeNames = filtered.screens.map((screen) => screen.name);
  const options = {
    routeNames,
    routeParamList: {},
    routeGetIdList: {},
    routeKeyChanges: [],
  };
  const [state, setState] = useState(() =>
    router.getRehydratedState(
      {
        stale: true,
        routes: navigationState?.routes.map(({ key, name, params }) => ({
          key,
          name,
          params,
        })) ?? [{ name: mockInitialRoute }],
      },
      options,
    ),
  );
  const accessibleState = router.getStateForRouteNamesChange(state, options);
  dispatch = (action) =>
    setState(
      router.getRehydratedState(
        router.getStateForAction(accessibleState, action, options) ??
          accessibleState,
        options,
      ),
    );
  navigationState = accessibleState;
  activeRoute = accessibleState.routes[accessibleState.index]?.name;
  const isPrivate = ['(tabs)', 'wardrobe', 'article/[id]'].includes(
    activeRoute ?? '',
  );
  return createElement(
    Fragment,
    null,
    isPrivate ? createElement(PrivateScreen) : null,
  );
}

async function renderRoot() {
  await act(async () => {
    renderer ??= createRoot();
    renderer.render(createElement(RootLayout));
  });
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  mockClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  mockAuth = {
    isAuthenticated: false,
    currentUser: null,
    sessionVersion: 0,
    isHydratingAuth: false,
  };
  mockLoadingPreferences = false;
  mockCompletedOnboarding = false;
  mockInitialRoute = 'index';
  routeNames = [];
  activeRoute = undefined;
  navigationState = undefined;
  privateMounts = 0;
  screenFeedback.mockClear();
  dataCompletion.mockClear();
});

afterEach(async () => {
  await act(async () => {
    renderer?.unmount();
  });
  // Each test creates a new root instead of updating an unmounted renderer.
  renderer = undefined;
  mockClient.clear();
  jest.restoreAllMocks();
});

it.each(['auth', 'preferences'])(
  'waits for %s hydration before mounting any routes',
  async (pending) => {
    mockAuth = {
      ...mockAuth,
      isAuthenticated: true,
      currentUser: USER,
      isHydratingAuth: pending === 'auth',
    };
    mockLoadingPreferences = pending === 'preferences';
    await renderRoot();
    expect(
      renderer?.container.queryAll((node) => node.props.id === 'auth-loader'),
    ).toHaveLength(1);
    expect(routeNames).toEqual([]);
    expect(privateMounts).toBe(0);
    mockAuth.isHydratingAuth = false;
    mockLoadingPreferences = false;
    await renderRoot();
    expect(activeRoute).toBe('(tabs)');
  },
);

it.each([
  'wardrobe',
  'article/[id]',
  'article-quiz/[id]',
  'dictionary-test',
  'notification-test',
  'modal',
  '(tabs)',
])('rejects a signed-out direct link to %s', async (route) => {
  mockInitialRoute = route;
  await renderRoot();
  expect(activeRoute).toBe('index');
  expect(routeNames).not.toContain(route);
  expect(privateMounts).toBe(0);
  await act(async () => {
    dispatch(StackActions.push(route));
  });
  expect(activeRoute).toBe('index');
});

it.each(['about', 'reset-password'])(
  'retains signed-out access to %s',
  async (route) => {
    mockInitialRoute = route;
    await renderRoot();
    expect(activeRoute).toBe(route);
  },
);

it('inventories every file route, including wardrobe, into an explicit policy', async () => {
  await renderRoot();
  const publicRoutes = [...routeNames];
  mockAuth = {
    ...mockAuth,
    isAuthenticated: true,
    currentUser: USER,
    sessionVersion: 1,
  };
  await renderRoot();
  const registeredRoutes = new Set([...publicRoutes, ...routeNames]);
  const files = readdirSync(join(__dirname, '../app'), { recursive: true });
  const actualRoutes = files
    .filter((file): file is string => typeof file === 'string')
    .map((file) => file.replaceAll('\\', '/'))
    .filter(
      (file) =>
        file.endsWith('.tsx') &&
        !file.endsWith('_layout.tsx') &&
        !file.startsWith('(tabs)/'),
    )
    .map((file) => file.slice(0, -4));
  expect([...registeredRoutes].sort()).toEqual(
    [...actualRoutes, '(tabs)'].sort(),
  );
});

it('changes route trees on login/logout and cannot go back to an inaccessible screen', async () => {
  mockInitialRoute = 'wardrobe';
  await renderRoot();
  expect(activeRoute).toBe('index');
  mockAuth = {
    ...mockAuth,
    isAuthenticated: true,
    currentUser: USER,
    sessionVersion: 1,
  };
  await renderRoot();
  expect(activeRoute).toBe('(tabs)');
  await act(async () => {
    dispatch(StackActions.push('wardrobe'));
  });
  expect(activeRoute).toBe('wardrobe');
  mockAuth = {
    ...mockAuth,
    isAuthenticated: false,
    currentUser: null,
    sessionVersion: 2,
  };
  await renderRoot();
  await act(async () => {
    dispatch(CommonActions.goBack());
  });
  expect(activeRoute).toBe('index');
  expect(routeNames).not.toContain('wardrobe');
});

it('preserves the current screen and observer through token refresh', async () => {
  mockInitialRoute = 'wardrobe';
  mockAuth = {
    ...mockAuth,
    isAuthenticated: true,
    currentUser: USER,
    sessionVersion: 1,
  };
  await renderRoot();
  await act(async () => {
    startMutation();
  });
  await renderRoot(); // A refresh does not advance sessionVersion.
  expect(activeRoute).toBe('wardrobe');
  expect(privateMounts).toBe(1);
  await act(async () => {
    finishMutation();
  });
  expect(screenFeedback).toHaveBeenCalledTimes(1);
});

it.each(['same account', 'another account'])(
  'drops old mutation feedback on a new session: %s',
  async (scenario) => {
    mockInitialRoute = 'wardrobe';
    mockAuth = {
      ...mockAuth,
      isAuthenticated: true,
      currentUser: USER,
      sessionVersion: 1,
    };
    await renderRoot();
    await act(async () => {
      startMutation();
    });
    mockAuth = {
      ...mockAuth,
      sessionVersion: 2,
      currentUser: {
        ...USER,
        id: scenario === 'same account' ? 'reader-a' : 'reader-b',
      },
    };
    await renderRoot();
    expect(privateMounts).toBe(2);
    await act(async () => {
      finishMutation();
    });
    expect(dataCompletion).toHaveBeenCalledTimes(1);
    expect(screenFeedback).not.toHaveBeenCalled();
  },
);

it('preserves onboarding at the signed-out fallback and selects login once completed', async () => {
  await renderRoot();
  expect(IndexScreen().type).toBe(StartScreen);
  mockCompletedOnboarding = true;
  expect(IndexScreen()).toMatchObject({
    type: Redirect,
    props: { href: '/login' },
  });
});

it.each(['login', 'about'])(
  'blocks authenticated navigation to %s',
  async (route) => {
    mockAuth = {
      ...mockAuth,
      isAuthenticated: true,
      currentUser: USER,
      sessionVersion: 1,
    };
    await renderRoot();
    await act(async () => {
      dispatch(StackActions.push(route));
    });
    expect(activeRoute).toBe('(tabs)');
    expect(routeNames).not.toContain(route);
  },
);

it('removes onboarding about from history after login', async () => {
  mockInitialRoute = 'about';
  await renderRoot();
  expect(activeRoute).toBe('about');
  mockAuth = {
    ...mockAuth,
    isAuthenticated: true,
    currentUser: USER,
    sessionVersion: 1,
  };
  await renderRoot();
  await act(async () => {
    dispatch(CommonActions.goBack());
  });
  expect(activeRoute).toBe('(tabs)');
  expect(routeNames).not.toContain('about');
});

it('discards pending screen feedback when logout removes the private tree', async () => {
  mockAuth = {
    ...mockAuth,
    isAuthenticated: true,
    currentUser: USER,
    sessionVersion: 1,
  };
  await renderRoot();
  await act(async () => {
    startMutation();
  });
  mockAuth = {
    ...mockAuth,
    isAuthenticated: false,
    currentUser: null,
    sessionVersion: 2,
  };
  await renderRoot();
  await act(async () => {
    finishMutation();
  });
  expect(dataCompletion).toHaveBeenCalledTimes(1);
  expect(screenFeedback).not.toHaveBeenCalled();
});
