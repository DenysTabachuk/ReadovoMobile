import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthSessionSnapshot } from '@/features/auth';
import { completeStreakActivity } from '../../api/requests/completeStreakActivity';
import { getStreakProfile } from '../../api/requests/getStreakProfile';
import { applyStreakFreeze } from '../../api/requests/applyStreakFreeze';
import { restoreBrokenStreak } from '../../api/requests/restoreBrokenStreak';
import { purchaseStreakFreezeToken } from '../../api/requests/purchaseStreakFreezeToken';
import type { StreakState } from '../../types';
import { syncPendingStreakEvents } from '../syncPendingStreakEvents';
import { trackLearningActivity } from '.';
import { restoreStreakForCoins } from '../restoreStreakForCoins';
import { applyFreezeToMissedDay } from '../applyFreezeToMissedDay';
import { buyStreakFreezeToken } from '../buyStreakFreezeToken';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('@/features/auth', () => ({ getAuthSessionSnapshot: jest.fn() }));

jest.mock('../../api/requests/completeStreakActivity', () => ({
  completeStreakActivity: jest.fn(),
}));
jest.mock('../../api/requests/getStreakProfile', () => ({
  getStreakProfile: jest.fn(),
}));
jest.mock('../../api/requests/applyStreakFreeze', () => ({
  applyStreakFreeze: jest.fn(),
}));
jest.mock('../../api/requests/restoreBrokenStreak', () => ({
  restoreBrokenStreak: jest.fn(),
}));
jest.mock('../../api/requests/purchaseStreakFreezeToken', () => ({
  purchaseStreakFreezeToken: jest.fn(),
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
  jest.mocked(getStreakProfile).mockResolvedValue(PROFILE);
  jest.mocked(restoreBrokenStreak).mockResolvedValue(PROFILE);
  jest.mocked(applyStreakFreeze).mockResolvedValue(PROFILE);
  jest.mocked(purchaseStreakFreezeToken).mockResolvedValue(PROFILE);
});

afterEach(() => jest.useRealTimers());

it('submits activity metadata without an owner field and without queueing successful requests', async () => {
  await expect(
    trackLearningActivity('reader-a', 'article_quiz_completed'),
  ).resolves.toBe(PROFILE);
  expect(completeStreakActivity).toHaveBeenCalledWith({
    activityType: 'article_quiz_completed',
    occurredAtClient: '2026-07-09T12:00:00.000Z',
    timezone: expect.any(String),
  });
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});

it('queues a network failure for its owner and fetches the current profile as fallback', async () => {
  jest.mocked(completeStreakActivity).mockRejectedValue(new Error('Offline'));
  await expect(
    trackLearningActivity('reader-a', 'lexical_test_completed'),
  ).resolves.toBe(PROFILE);
  expect(getStreakProfile).toHaveBeenCalledWith();
  expect(JSON.parse(values.get(`${STORAGE_KEY}:reader-a`)!)).toEqual([
    {
      activityType: 'lexical_test_completed',
      createdAt: '2026-07-09T12:00:00.000Z',
    },
  ]);
});

it('preserves the default profile fallback when both network requests fail', async () => {
  jest.mocked(completeStreakActivity).mockRejectedValue(new Error('Offline'));
  jest.mocked(getStreakProfile).mockRejectedValue(new Error('Offline'));
  await expect(
    trackLearningActivity('reader-a', 'article_quiz_completed'),
  ).resolves.toMatchObject({
    currentStreak: 0,
    todayStatus: 'pending',
    serverNow: '2026-07-09T12:00:00.000Z',
  });
});

it('does not queue or fetch a fallback when the original request finishes in a different session', async () => {
  jest.mocked(completeStreakActivity).mockImplementationOnce(async () => {
    assertCurrent.mockImplementation(() => {
      throw abort;
    });
    throw abort;
  });
  await expect(
    trackLearningActivity('reader-a', 'article_quiz_completed'),
  ).rejects.toBe(abort);
  expect(getStreakProfile).not.toHaveBeenCalled();
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});

it('does not start a fallback request after the account changes during queue persistence', async () => {
  jest.mocked(completeStreakActivity).mockRejectedValue(new Error('Offline'));
  jest
    .mocked(AsyncStorage.setItem)
    .mockImplementationOnce(async (key, value) => {
      values.set(key, value);
      assertCurrent.mockImplementation(() => {
        throw abort;
      });
    });
  await expect(
    trackLearningActivity('reader-a', 'article_quiz_completed'),
  ).rejects.toBe(abort);
  expect(getStreakProfile).not.toHaveBeenCalled();
  expect(values.has(`${STORAGE_KEY}:reader-a`)).toBe(true);
  expect(values.has(`${STORAGE_KEY}:reader-b`)).toBe(false);
});

it('rejects a profile returned after a session change instead of returning the fallback', async () => {
  jest.mocked(completeStreakActivity).mockRejectedValue(new Error('Offline'));
  jest.mocked(getStreakProfile).mockImplementationOnce(async () => {
    assertCurrent.mockImplementation(() => {
      throw abort;
    });
    return PROFILE;
  });
  await expect(
    trackLearningActivity('reader-a', 'article_quiz_completed'),
  ).rejects.toBe(abort);
});

it('rejects an account mismatch before reading queues or starting requests', async () => {
  jest.mocked(getAuthSessionSnapshot).mockRejectedValue(abort);
  await expect(syncPendingStreakEvents('reader-a')).rejects.toBe(abort);
  await expect(
    trackLearningActivity('reader-a', 'article_quiz_completed'),
  ).rejects.toBe(abort);
  await expect(restoreStreakForCoins('reader-a')).rejects.toBe(abort);
  await expect(applyFreezeToMissedDay('reader-a', '2026-07-08')).rejects.toBe(
    abort,
  );
  await expect(buyStreakFreezeToken('reader-a')).rejects.toBe(abort);
  expect(AsyncStorage.getItem).not.toHaveBeenCalled();
  expect(completeStreakActivity).not.toHaveBeenCalled();
  expect(restoreBrokenStreak).not.toHaveBeenCalled();
  expect(applyStreakFreeze).not.toHaveBeenCalled();
  expect(purchaseStreakFreezeToken).not.toHaveBeenCalled();
});

it('checks the snapshot again before starting work after its asynchronous capture', async () => {
  assertCurrent.mockImplementation(() => {
    throw abort;
  });
  await expect(syncPendingStreakEvents('reader-a')).rejects.toBe(abort);
  await expect(
    trackLearningActivity('reader-a', 'article_quiz_completed'),
  ).rejects.toBe(abort);
  await expect(restoreStreakForCoins('reader-a')).rejects.toBe(abort);
  await expect(applyFreezeToMissedDay('reader-a', '2026-07-08')).rejects.toBe(
    abort,
  );
  await expect(buyStreakFreezeToken('reader-a')).rejects.toBe(abort);
  expect(AsyncStorage.getItem).not.toHaveBeenCalled();
  expect(completeStreakActivity).not.toHaveBeenCalled();
  expect(restoreBrokenStreak).not.toHaveBeenCalled();
  expect(applyStreakFreeze).not.toHaveBeenCalled();
  expect(purchaseStreakFreezeToken).not.toHaveBeenCalled();
});
