import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthSessionSnapshot } from '@/features/auth';
import { completeStreakActivity } from '../../api/requests/completeStreakActivity';
import type { StreakState } from '../../types';
import { syncPendingStreakEvents } from '.';
import { queuePendingStreakEvent } from '../queuePendingStreakEvent';

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

const abort = Object.assign(new Error('Authentication session changed.'), {
  name: 'AbortError',
});

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

it('keeps only failed events and preserves their order when replaying', async () => {
  const events = [
    { activityType: 'article_quiz_completed', createdAt: 'first' },
    { activityType: 'lexical_test_completed', createdAt: 'second' },
  ];
  values.set(`${STORAGE_KEY}:reader-a`, JSON.stringify(events));
  jest
    .mocked(completeStreakActivity)
    .mockRejectedValueOnce(new Error('Offline'));
  await syncPendingStreakEvents('reader-a');
  expect(completeStreakActivity).toHaveBeenNthCalledWith(1, {
    activityType: 'article_quiz_completed',
  });
  expect(completeStreakActivity).toHaveBeenNthCalledWith(2, {
    activityType: 'lexical_test_completed',
  });
  expect(JSON.parse(values.get(`${STORAGE_KEY}:reader-a`)!)).toEqual([
    events[0],
  ]);
});

it('stops replay after an account change without sending another event or losing the queue', async () => {
  await queuePendingStreakEvent('reader-a', 'article_quiz_completed');
  await queuePendingStreakEvent('reader-a', 'lexical_test_completed');
  const before = values.get(`${STORAGE_KEY}:reader-a`);
  jest.mocked(completeStreakActivity).mockImplementationOnce(async () => {
    assertCurrent.mockImplementation(() => {
      throw abort;
    });
    return { streak: PROFILE };
  });
  await expect(syncPendingStreakEvents('reader-a')).rejects.toBe(abort);
  expect(completeStreakActivity).toHaveBeenCalledTimes(1);
  expect(values.get(`${STORAGE_KEY}:reader-a`)).toBe(before);
});

it('checks the session after asynchronous queue storage reads', async () => {
  jest.mocked(AsyncStorage.getItem).mockImplementationOnce(async () => {
    assertCurrent.mockImplementation(() => {
      throw abort;
    });
    return '[{"activityType":"article_quiz_completed"}]';
  });
  await expect(syncPendingStreakEvents('reader-a')).rejects.toBe(abort);
  expect(completeStreakActivity).not.toHaveBeenCalled();
});
