import { getAuthSessionSnapshot } from '@/features/auth';
import { restoreBrokenStreak } from '../../api/requests/restoreBrokenStreak';
import type { StreakState } from '../../types';
import { STREAK_RESTORE_PRICE } from '../../constants';
import { restoreStreakForCoins } from '.';

jest.mock('@/features/auth', () => ({ getAuthSessionSnapshot: jest.fn() }));
jest.mock('../../api/requests/restoreBrokenStreak', () => ({
  restoreBrokenStreak: jest.fn(),
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
  jest.mocked(restoreBrokenStreak).mockResolvedValue(PROFILE);
});

it('preserves the payload and profile without sending a local owner ID', async () => {
  await expect(restoreStreakForCoins('reader-a')).resolves.toBe(PROFILE);
  expect(getAuthSessionSnapshot).toHaveBeenCalledWith('reader-a');
  expect(restoreBrokenStreak).toHaveBeenCalledWith({
    price: STREAK_RESTORE_PRICE,
  });
});

it('does not send a request when the captured session is already invalid', async () => {
  assertCurrent.mockImplementation(() => {
    throw abort;
  });
  await expect(restoreStreakForCoins('reader-a')).rejects.toBe(abort);
  expect(restoreBrokenStreak).not.toHaveBeenCalled();
});

it('rejects a profile returned after the session changes', async () => {
  jest.mocked(restoreBrokenStreak).mockImplementationOnce(async () => {
    assertCurrent.mockImplementation(() => {
      throw abort;
    });
    return PROFILE;
  });
  await expect(restoreStreakForCoins('reader-a')).rejects.toBe(abort);
});

it('preserves request errors', async () => {
  const error = new Error('Request failed');
  jest.mocked(restoreBrokenStreak).mockRejectedValue(error);
  await expect(restoreStreakForCoins('reader-a')).rejects.toBe(error);
});
