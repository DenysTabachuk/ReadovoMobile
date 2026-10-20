import { getAuthSessionSnapshot } from '@/features/auth';
import { applyStreakFreeze } from '../../api/requests/applyStreakFreeze';
import type { StreakState } from '../../types';

import { applyFreezeToMissedDay } from '.';

jest.mock('@/features/auth', () => ({ getAuthSessionSnapshot: jest.fn() }));
jest.mock('../../api/requests/applyStreakFreeze', () => ({
  applyStreakFreeze: jest.fn(),
}));

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
  todayStatus: 'pending',
};
const assertCurrent = jest.fn();
const abort = Object.assign(new Error('Authentication session changed.'), {
  name: 'AbortError',
});
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(getAuthSessionSnapshot).mockResolvedValue({ assertCurrent });
  jest.mocked(applyStreakFreeze).mockResolvedValue(PROFILE);
});

it('preserves the payload and profile without sending a local owner ID', async () => {
  await expect(applyFreezeToMissedDay('reader-a', '2026-07-08')).resolves.toBe(
    PROFILE,
  );
  expect(getAuthSessionSnapshot).toHaveBeenCalledWith('reader-a');
  expect(applyStreakFreeze).toHaveBeenCalledWith({ date: '2026-07-08' });
});

it('does not send a request when the captured session is already invalid', async () => {
  assertCurrent.mockImplementation(() => {
    throw abort;
  });
  await expect(applyFreezeToMissedDay('reader-a', '2026-07-08')).rejects.toBe(
    abort,
  );
  expect(applyStreakFreeze).not.toHaveBeenCalled();
});

it('rejects a profile returned after the session changes', async () => {
  jest.mocked(applyStreakFreeze).mockImplementationOnce(async () => {
    assertCurrent.mockImplementation(() => {
      throw abort;
    });
    return PROFILE;
  });
  await expect(applyFreezeToMissedDay('reader-a', '2026-07-08')).rejects.toBe(
    abort,
  );
});

it('preserves request errors', async () => {
  const error = new Error('Request failed');
  jest.mocked(applyStreakFreeze).mockRejectedValue(error);
  await expect(applyFreezeToMissedDay('reader-a', '2026-07-08')).rejects.toBe(
    error,
  );
});
