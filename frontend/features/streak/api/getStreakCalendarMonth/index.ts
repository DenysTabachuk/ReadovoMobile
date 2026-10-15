import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import type { StreakCalendarMonthResponse } from '../../types';

export async function getStreakCalendarMonth(
  userId: string,
  year: number,
  month: number,
): Promise<StreakCalendarMonthResponse> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/streak/profile/${userId}/calendar/month?year=${year}&month=${month}`,
  );

  if (!response.ok) {
    throw new Error('profile.errors.loadFailed');
  }

  return response.json() as Promise<StreakCalendarMonthResponse>;
}
