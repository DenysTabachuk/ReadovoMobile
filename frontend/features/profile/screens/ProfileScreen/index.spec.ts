import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getStreakProfile } from '@/features/streak';
import { ProfileStreak } from './components/profileStreak';
import ProfileScreen from '.';

jest.mock('react-native', () => ({
  View: 'div',
  ScrollView: 'section',
  Pressable: 'button',
  StyleSheet: { create: <T>(styles: T) => styles },
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('@/components/fullScreenLoader', () => ({
  FullScreenLoader: () => null,
}));
jest.mock('@/components/screenContainer', () => ({ ScreenContainer: 'main' }));
jest.mock('@/components/themedText', () => ({ ThemedText: 'span' }));
jest.mock('@/features/auth', () => ({
  useAuthenticatedUser: () => ({ id: 'reader-a' }),
}));
jest.mock('@/features/achievements', () => ({
  useAchievementsProfileQuery: () => ({
    data: {
      achievements: [],
      progress: {
        balance: 0,
        lessonsCompleted: 0,
        testsCompleted: 0,
        wordsLearned: 0,
      },
    },
    refetch: jest.fn(),
  }),
}));
jest.mock('@/features/mascot', () => ({
  useMascotProfileQuery: () => ({
    data: { equippedItems: {} },
    refetch: jest.fn(),
  }),
}));
jest.mock('@/features/streak', () => ({
  ...jest.requireActual('@/features/streak/api/queries/useStreakProfileQuery'),
  ...jest.requireActual('@/features/streak/api/requests'),
}));
jest.mock('@/features/streak/api/requests/getStreakProfile', () => ({
  getStreakProfile: jest.fn(),
}));
jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'light',
}));
jest.mock('./components/profileAchievements', () => ({
  ProfileAchievements: () => null,
}));
jest.mock('./components/profileStats', () => ({ ProfileStats: () => null }));
jest.mock('./components/profileSummary', () => ({
  ProfileSummary: () => null,
}));
jest.mock('./components/profileStreak', () => ({
  ProfileStreak: jest.fn(() => null),
}));

let renderer: Root | undefined;
let client: QueryClient;

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  jest.useFakeTimers();
  jest.clearAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

afterEach(async () => {
  await act(async () => {
    renderer?.unmount();
  });
  client.clear();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it('keeps streak controls unmounted after an initial query failure and lets the user retry', async () => {
  jest.mocked(getStreakProfile).mockRejectedValue(new Error('Unavailable'));
  await act(async () => {
    renderer = createRoot();
    renderer.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(ProfileScreen),
      ),
    );
  });
  await act(async () => {
    await jest.advanceTimersByTimeAsync(0);
  });
  expect(ProfileStreak).not.toHaveBeenCalled();
  expect(getStreakProfile).toHaveBeenCalledTimes(1);
  const retry = renderer?.container.queryAll(
    (node) => node.type === 'button',
  )[0];
  expect(retry).toBeDefined();
  await act(async () => {
    retry?.props.onPress();
  });
  await act(async () => {
    await jest.advanceTimersByTimeAsync(0);
  });
  expect(getStreakProfile).toHaveBeenCalledTimes(2);
  expect(ProfileStreak).not.toHaveBeenCalled();
});
