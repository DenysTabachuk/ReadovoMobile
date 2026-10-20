import type { StreakState } from '../../types';
import { createInstance } from 'i18next';
import en from '@/localization/en/translation.json';
import uk from '@/localization/uk/translation.json';
import { getStreakReminderState } from '.';
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

it('selects reminder keys for a pending day without modifying the profile', () => {
  const profile = Object.freeze({ ...PROFILE });
  expect(getStreakReminderState(profile)).toEqual({
    ctaKey: 'streak.reminder.cta',
    messageKey: 'streak.reminder.message',
    shouldShow: true,
  });
  expect(profile.todayStatus).toBe('pending');
});
it.each(['completed', 'missed', 'frozen', 'restored', 'broken'] as const)(
  'hides the reminder for %s',
  (status) => {
    expect(getStreakReminderState({ ...PROFILE, todayStatus: status })).toEqual(
      { ctaKey: null, messageKey: null, shouldShow: false },
    );
  },
);

it.each([
  { locale: 'en', cta: 'Start now', message: 'Your streak is at risk' },
  { locale: 'uk', cta: 'Почати зараз', message: 'Твій відрізок у небезпеці' },
])(
  'resolves reminder keys in $locale without fallback text',
  async ({ locale, cta, message }) => {
    const i18n = createInstance();
    await i18n.init({
      lng: locale,
      fallbackLng: false,
      resources: { en: { translation: en }, uk: { translation: uk } },
    });
    const reminder = getStreakReminderState(PROFILE);
    if (!reminder.shouldShow) {
      throw new Error('Expected a visible reminder for pending activity.');
    }
    expect(i18n.t(reminder.ctaKey)).toBe(cta);
    expect(i18n.t(reminder.messageKey)).toBe(message);
  },
);
