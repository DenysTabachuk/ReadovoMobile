import type { StreakState, StreakTodayStatus } from '../../types';
import { didCompleteStreakToday } from '.';
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

it('detects completion from each known non-completed state', () => {
  for (const status of [
    'pending',
    'missed',
    'frozen',
    'restored',
    'broken',
  ] as const) {
    expect(
      didCompleteStreakToday(
        { ...PROFILE, todayStatus: status },
        { ...PROFILE, todayStatus: 'completed' },
      ),
    ).toBe(true);
  }
});
it('does not report an already completed day as a new completion', () => {
  const completed = { ...PROFILE, todayStatus: 'completed' as const };
  expect(didCompleteStreakToday(completed, completed)).toBe(false);
});
it.each([null, undefined])('requires a previous profile: %s', (previous) => {
  expect(
    didCompleteStreakToday(previous, { ...PROFILE, todayStatus: 'completed' }),
  ).toBe(false);
});
it.each([null, undefined])('requires a next profile: %s', (next) => {
  expect(didCompleteStreakToday(PROFILE, next)).toBe(false);
});
it('ignores next profiles that are not completed without changing either input', () => {
  const previous = Object.freeze({ ...PROFILE });
  for (const status of [
    'pending',
    'missed',
    'frozen',
    'restored',
    'broken',
  ] satisfies StreakTodayStatus[]) {
    const next = Object.freeze({ ...PROFILE, todayStatus: status });
    expect(didCompleteStreakToday(previous, next)).toBe(false);
    expect(next.todayStatus).toBe(status);
  }
});
