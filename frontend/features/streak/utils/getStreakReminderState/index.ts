import type { StreakReminderState, StreakState } from '../../types';

/**
 * Selects reminder translation keys for a streak awaiting activity today.
 * @param streak - Current profile state.
 * @returns Visible reminder keys only for pending status; otherwise null keys.
 * The caller translates the keys when presenting the reminder in the active locale.
 * @example
 * getStreakReminderState({ ...profile, todayStatus: 'completed' });
 * // => { ctaKey: null, messageKey: null, shouldShow: false }
 */
export function getStreakReminderState(
  streak: StreakState,
): StreakReminderState {
  if (streak.todayStatus === 'pending') {
    return {
      ctaKey: 'streak.reminder.cta',
      messageKey: 'streak.reminder.message',
      shouldShow: true,
    };
  }

  return {
    ctaKey: null,
    messageKey: null,
    shouldShow: false,
  };
}
