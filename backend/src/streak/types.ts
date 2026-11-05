import {
  STREAK_CALENDAR_DAY_STATUSES,
  STREAK_DAY_STATUSES,
  STREAK_MILESTONES,
  STREAK_TODAY_STATUSES,
} from './constants';
import {
  type BrokenStreakInfoDto,
  type GetStreakProfileResponseDto,
} from './dto/get-streak-profile-response.dto';

export type StreakTodayStatus = (typeof STREAK_TODAY_STATUSES)[number];
export type StreakDayStatus = (typeof STREAK_DAY_STATUSES)[number];
export type CalendarDayStatus = (typeof STREAK_CALENDAR_DAY_STATUSES)[number];
export type StreakAchievementMilestone =
  (typeof STREAK_MILESTONES)[number]['milestone'];

export type BrokenStreakInfo = BrokenStreakInfoDto;
export type StreakState = GetStreakProfileResponseDto;

export type { StreakAchievementDto as StreakAchievement } from './dto/get-streak-profile-response.dto';
export type {
  StreakCalendarDayDto as StreakCalendarDay,
  GetStreakCalendarMonthResponseDto as StreakCalendarMonthResponse,
} from './dto/get-streak-calendar-month-response.dto';

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
