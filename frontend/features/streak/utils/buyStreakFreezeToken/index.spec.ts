import { getAuthSessionSnapshot } from '@/features/auth';
import { purchaseStreakFreezeToken } from '../../api/requests/purchaseStreakFreezeToken';
import type { StreakState } from '../../types';
import { STREAK_FREEZE_TOKEN_PRICE } from '../../constants';
import { buyStreakFreezeToken } from '.';

jest.mock('@/features/auth', () => ({ getAuthSessionSnapshot: jest.fn() }));
jest.mock('../../api/requests/purchaseStreakFreezeToken', () => ({
  purchaseStreakFreezeToken: jest.fn(),
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
  jest.mocked(purchaseStreakFreezeToken).mockResolvedValue(PROFILE);
});

it('preserves the payload and profile without sending a local owner ID', async () => {
  await expect(buyStreakFreezeToken('reader-a')).resolves.toBe(PROFILE);
  expect(getAuthSessionSnapshot).toHaveBeenCalledWith('reader-a');
  expect(purchaseStreakFreezeToken).toHaveBeenCalledWith({
    price: STREAK_FREEZE_TOKEN_PRICE,
  });
});

it('does not send a request when the captured session is already invalid', async () => {
  assertCurrent.mockImplementation(() => {
    throw abort;
  });
  await expect(buyStreakFreezeToken('reader-a')).rejects.toBe(abort);
  expect(purchaseStreakFreezeToken).not.toHaveBeenCalled();
});

it('rejects a profile returned after the session changes', async () => {
  jest.mocked(purchaseStreakFreezeToken).mockImplementationOnce(async () => {
    assertCurrent.mockImplementation(() => {
      throw abort;
    });
    return PROFILE;
  });
  await expect(buyStreakFreezeToken('reader-a')).rejects.toBe(abort);
});

it('preserves request errors', async () => {
  const error = new Error('Request failed');
  jest.mocked(purchaseStreakFreezeToken).mockRejectedValue(error);
  await expect(buyStreakFreezeToken('reader-a')).rejects.toBe(error);
});
