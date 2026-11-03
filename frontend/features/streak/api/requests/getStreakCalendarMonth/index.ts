import { api } from '@/features/auth';

import type {
  StreakCalendarMonthResponse,
  StreakCalendarMonthQuery,
} from '@/api/generated/transport';

export async function getStreakCalendarMonth({
  year,
  month,
}: StreakCalendarMonthQuery): Promise<StreakCalendarMonthResponse> {
  const response = await api.get<StreakCalendarMonthResponse>(
    `/streak/profile/me/calendar/month?year=${year}&month=${month}`,
  );

  return response.data;
}
