import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import type { StreakCalendarMonthResponse } from '../../../types';

type GetStreakCalendarMonthParams = {
  year: number;
  month: number;
};

export async function getStreakCalendarMonth({
  year,
  month,
}: GetStreakCalendarMonthParams): Promise<StreakCalendarMonthResponse> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/streak/profile/me/calendar/month?year=${year}&month=${month}`,
  );

  if (!response.ok) {
    throw new Error('profile.errors.loadFailed');
  }

  return response.json() as Promise<StreakCalendarMonthResponse>;
}
