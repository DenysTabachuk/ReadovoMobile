import { useQuery } from '@tanstack/react-query';
import { useAuthenticatedUser } from '@/features/auth';

import { getStreakCalendarMonth } from '../../requests/getStreakCalendarMonth';

type UseStreakCalendarMonthQueryParams = {
  year: number;
  month: number;
};

export function useStreakCalendarMonthQuery({
  year,
  month,
}: UseStreakCalendarMonthQueryParams) {
  const { id: userId } = useAuthenticatedUser();
  return useQuery({
    queryFn: () => getStreakCalendarMonth({ year, month }),
    queryKey: ['streak-calendar-month', userId, year, month],
  });
}
