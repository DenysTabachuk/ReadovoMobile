import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';

import { getStreakCalendarMonth } from '../../requests/getStreakCalendarMonth';

type UseStreakCalendarMonthQueryParams = {
  year: number;
  month: number;
};

export function useStreakCalendarMonthQuery({
  year,
  month,
}: UseStreakCalendarMonthQueryParams) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  return useQuery({
    enabled: Boolean(userId),
    queryFn: () => getStreakCalendarMonth({ year, month }),
    queryKey: ['streak-calendar-month', userId, year, month],
  });
}
