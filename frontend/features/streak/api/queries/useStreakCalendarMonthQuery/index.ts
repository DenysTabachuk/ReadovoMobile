import { useQuery } from '@tanstack/react-query';
import { useAuthenticatedUser } from '@/features/auth';

import { getStreakCalendarMonth } from '../../requests/getStreakCalendarMonth';

type UseStreakCalendarMonthQueryParams = {
  year: number;
  month: number;
};

export function streakCalendarMonthQueryOptions(
  userId: string,
  { year, month }: UseStreakCalendarMonthQueryParams,
) {
  return {
    queryFn: () => getStreakCalendarMonth({ year, month }),
    queryKey: ['streak-calendar-month', userId, year, month],
  };
}

export function useStreakCalendarMonthQuery({
  year,
  month,
}: UseStreakCalendarMonthQueryParams) {
  const { id: userId } = useAuthenticatedUser();
  return useQuery(streakCalendarMonthQueryOptions(userId, { year, month }));
}
