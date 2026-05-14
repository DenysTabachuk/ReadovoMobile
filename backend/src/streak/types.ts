export type StreakTodayStatus =
  | 'completed'
  | 'pending'
  | 'missed'
  | 'frozen'
  | 'restored'
  | 'broken';

export type StreakDayStatus = 'completed' | 'missed' | 'frozen' | 'restored';
export type CalendarDayStatus =
  | 'completed'
  | 'missed'
  | 'frozen'
  | 'restored'
  | 'today_pending'
  | 'today_completed'
  | 'future'
  | 'neutral';

export type StreakActivityType =
  | 'lexical_test_completed'
  | 'article_quiz_completed';

export type StreakHistoryDay = {
  date: string;
  status: StreakDayStatus;
};

export type BrokenStreakInfo = {
  brokenAt: string;
  canRestore: boolean;
  previousStreak: number;
  restorePrice: number;
};

export type StreakAchievementMilestone = 3 | 7 | 14 | 30 | 100;

export type StreakAchievement = {
  claimedAt: string | null;
  isUnlocked: boolean;
  milestone: StreakAchievementMilestone;
  rewardCoins: number;
};

export type StreakState = {
  activityHistory: StreakHistoryDay[];
  brokenStreakInfo: BrokenStreakInfo | null;
  claimedStreakAchievements: StreakAchievement[];
  coinBalance: number;
  currentStreak: number;
  freezeTokens: number;
  lastActivityDate: string | null;
  longestStreak: number;
  nextBonusInDays: number;
  nextMilestone: StreakAchievementMilestone;
  serverNow: string;
  todayStatus: StreakTodayStatus;
};

export type CompleteStreakActivityDto = {
  activityType: StreakActivityType;
  occurredAtClient?: string;
  timezone?: string;
};

export type RestoreStreakDto = {
  price: number;
};

export type CompleteStreakActivityResponse = {
  pendingSync?: boolean;
  streak: StreakState;
};

export type StreakProfileRow = {
  broken_streak_info: BrokenStreakInfo | null;
  current_streak: number;
  freeze_tokens: number;
  last_activity_date: string | null;
  longest_streak: number;
  timezone: string;
};

export type StreakHistoryRow = {
  activity_date: string;
  status: StreakDayStatus;
};

export type StreakClaimedAchievementRow = {
  claimed_at: Date;
  milestone: StreakAchievementMilestone;
  reward_coins: number;
};

export type StreakCalendarDay = {
  date: string;
  dayOfMonth: number;
  status: CalendarDayStatus;
};

export type StreakCalendarMonthResponse = {
  days: StreakCalendarDay[];
  month: number;
  monthLabel: string;
  serverNow: string;
  timezone: string;
  year: number;
};
