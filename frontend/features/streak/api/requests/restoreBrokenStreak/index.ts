import { api } from '@/features/auth';

import type { RestoreStreakRequest, StreakState } from '../../../types';

export async function restoreBrokenStreak(
  payload: RestoreStreakRequest,
): Promise<StreakState> {
  const response = await api.post<StreakState>(
    `/streak/profile/me/restore`,
    payload,
  );

  return response.data;
}
