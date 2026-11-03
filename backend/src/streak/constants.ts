export const STREAK_DAY_STATUSES = [
  'completed',
  'missed',
  'frozen',
  'restored',
] as const;
export const STREAK_TODAY_STATUSES = [
  'completed',
  'pending',
  'missed',
  'frozen',
  'restored',
  'broken',
] as const;
export const STREAK_CALENDAR_DAY_STATUSES = [
  'completed',
  'missed',
  'frozen',
  'restored',
  'today_pending',
  'today_completed',
  'future',
  'neutral',
] as const;

export const STREAK_MILESTONES = [
  { milestone: 3, rewardCoins: 30 },
  { milestone: 7, rewardCoins: 70 },
  { milestone: 14, rewardCoins: 150 },
  { milestone: 30, rewardCoins: 400 },
  { milestone: 100, rewardCoins: 1500 },
] as const;

export const STREAK_ACHIEVEMENT_MILESTONES = STREAK_MILESTONES.map(
  ({ milestone }) => milestone,
);
