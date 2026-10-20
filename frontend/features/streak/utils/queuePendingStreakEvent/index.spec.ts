import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthSessionSnapshot } from '@/features/auth';
import { completeStreakActivity } from '../../api/requests/completeStreakActivity';
import type { StreakState } from '../../types';
import { syncPendingStreakEvents } from '../syncPendingStreakEvents';
import { queuePendingStreakEvent } from '.';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('@/features/auth', () => ({ getAuthSessionSnapshot: jest.fn() }));

jest.mock('../../api/requests/completeStreakActivity', () => ({
  completeStreakActivity: jest.fn(),
}));
const STORAGE_KEY = 'readovo.streak.pendingActivityEvents';

const PROFILE: StreakState = {
  activityHistory: [],
  brokenStreakInfo: null,
  claimedStreakAchievements: [],
  coinBalance: 100,
  currentStreak: 1,
  freezeTokens: 1,
  lastActivityDate: null,
  longestStreak: 1,
  nextBonusInDays: 2,
  nextMilestone: 3,
  serverNow: '2026-07-09T12:00:00.000Z',
  todayStatus: 'completed',
};

const assertCurrent = jest.fn();

const values = new Map<string, string>();

beforeEach(() => {
  jest.resetAllMocks();
  values.clear();
  jest.useFakeTimers().setSystemTime(new Date('2026-07-09T12:00:00.000Z'));
  jest
    .mocked(AsyncStorage.getItem)
    .mockImplementation(async (key) => values.get(key) ?? null);
  jest.mocked(AsyncStorage.setItem).mockImplementation(async (key, value) => {
    values.set(key, value);
  });
  jest.mocked(getAuthSessionSnapshot).mockResolvedValue({ assertCurrent });
  jest.mocked(completeStreakActivity).mockResolvedValue({ streak: PROFILE });
});

afterEach(() => jest.useRealTimers());

it('stores events separately for each owner and never replays legacy unowned entries', async () => {
  const legacy =
    '[{"activityType":"article_quiz_completed","createdAt":"2026-07-01"}]';
  values.set(STORAGE_KEY, legacy);
  await queuePendingStreakEvent('reader-a', 'article_quiz_completed');
  await queuePendingStreakEvent('reader-b', 'lexical_test_completed');
  await syncPendingStreakEvents('reader-b');
  expect(completeStreakActivity).toHaveBeenCalledTimes(1);
  expect(completeStreakActivity).toHaveBeenCalledWith({
    activityType: 'lexical_test_completed',
  });
  expect(values.get(`${STORAGE_KEY}:reader-b`)).toBe('[]');
  expect(JSON.parse(values.get(`${STORAGE_KEY}:reader-a`)!)).toEqual([
    {
      activityType: 'article_quiz_completed',
      createdAt: '2026-07-09T12:00:00.000Z',
    },
  ]);
  expect(values.get(STORAGE_KEY)).toBe(legacy);
});
