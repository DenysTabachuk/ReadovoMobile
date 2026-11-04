export type {
  ApplyStreakFreezeRequest,
  BrokenStreakInfo,
  CalendarDayStatus,
  StreakAchievement,
  StreakAchievementMilestone,
  StreakCalendarDay,
  StreakCalendarMonthResponse,
  StreakDayStatus,
  StreakHistoryDay,
  StreakState,
  StreakTodayStatus,
} from '@/api/generated/transport';

export type StreakReminderState =
  | {
      ctaKey: 'streak.reminder.cta';
      messageKey: 'streak.reminder.message';
      shouldShow: true;
    }
  | {
      ctaKey: null;
      messageKey: null;
      shouldShow: false;
    };
