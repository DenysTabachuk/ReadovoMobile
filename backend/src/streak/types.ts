export type StreakTodayStatus =
  'completed' | 'pending' | 'missed' | 'frozen' | 'restored' | 'broken';

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

export type CompleteStreakActivityResponse = {
  streak: StreakState;
};

export type StreakProfileRecord = {
  brokenStreakInfo: BrokenStreakInfo | null;
  currentStreak: number;
  freezeTokens: number;
  lastActivityDate: string | null;
  longestStreak: number;
  timezone: string;
};

export type StreakHistoryRecord = {
  activityDate: string;
  status: StreakDayStatus;
};

export type StreakClaimedAchievementRecord = {
  claimedAt: Date;
  milestone: number;
  rewardCoins: number;
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
