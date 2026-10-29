import { api } from '@/features/auth';

import type { StreakCalendarMonthResponse } from '../../../types';

type GetStreakCalendarMonthParams = {
  year: number;
  month: number;
};

export async function getStreakCalendarMonth({
  year,
  month,
}: GetStreakCalendarMonthParams): Promise<StreakCalendarMonthResponse> {
  const response = await api.get<StreakCalendarMonthResponse>(
    `/streak/profile/me/calendar/month?year=${year}&month=${month}`,
  );

  return response.data;
}
