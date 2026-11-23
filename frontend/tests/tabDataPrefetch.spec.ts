import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import TabLayout from '../app/(tabs)/_layout';

jest.mock('expo-router', () => ({
  Tabs: Object.assign(() => null, { Screen: () => null }),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: String }) }));
jest.mock('@/components/hapticTab', () => ({ HapticTab: () => null }));
jest.mock('@/hooks/use-theme', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('@/features/auth', () => ({
  getAuthSessionVersion: () => 1,
  useAuthenticatedUser: () => ({ id: 'reader' }),
}));

const mockReadWords = jest.fn(async () => ['example']);
const mockReadAchievements = jest.fn(async () => ({ balance: 10 }));
const mockReadMascot = jest.fn(async () => ({ equipped: [] }));
const mockReadStreak = jest.fn<Promise<{ serverNow: string }>, []>();
const mockReadCalendar = jest.fn(async (year: number, month: number) => ({
  year,
  month,
}));

jest.mock('@/features/dictionary', () => ({
  dictionaryWordsQueryOptions: (id: string) => ({
    queryKey: ['words', id],
    queryFn: mockReadWords,
  }),
}));
jest.mock('@/features/achievements', () => ({
  achievementsProfileQueryOptions: (id: string) => ({
    queryKey: ['achievements', id],
    queryFn: mockReadAchievements,
  }),
}));
jest.mock('@/features/mascot', () => ({
  mascotProfileQueryOptions: (id: string) => ({
    queryKey: ['mascot', id],
    queryFn: mockReadMascot,
  }),
}));
jest.mock('@/features/streak', () => ({
  streakProfileQueryOptions: (id: string) => ({
    queryKey: ['streak', id],
    queryFn: mockReadStreak,
  }),
  streakCalendarMonthQueryOptions: (
    id: string,
    { year, month }: { year: number; month: number },
  ) => ({
    queryKey: ['calendar', id, year, month],
    queryFn: () => mockReadCalendar(year, month),
  }),
}));

it('fills the initial Dictionary and Profile caches before either screen mounts', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const root = createRoot();
  const client = new QueryClient();
  const streak = Promise.withResolvers<{ serverNow: string }>();
  mockReadStreak.mockReturnValue(streak.promise);

  try {
    await act(async () => {
      root.render(
        createElement(
          QueryClientProvider,
          { client },
          createElement(TabLayout),
        ),
      );
    });
    expect(client.getQueryData(['words', 'reader'])).toEqual(['example']);
    expect(client.getQueryData(['achievements', 'reader'])).toEqual({
      balance: 10,
    });
    expect(client.getQueryData(['mascot', 'reader'])).toEqual({ equipped: [] });
    expect(mockReadStreak).toHaveBeenCalledTimes(1);
    expect(mockReadCalendar).not.toHaveBeenCalled();

    await act(async () => {
      streak.resolve({ serverNow: '2026-02-01T00:00:00.000Z' });
    });
    expect(client.getQueryData(['calendar', 'reader', 2026, 2])).toEqual({
      year: 2026,
      month: 2,
    });
  } finally {
    await act(async () => root.unmount());
    client.clear();
  }
});
