import type { StreakActivityType } from '../types';

export type PendingActivityEvent = {
  activityType: StreakActivityType;
  createdAt: string;
};
