import { api } from '@/features/auth';

import type { ApplyStreakFreezeRequest, StreakState } from '../../../types';

export async function applyStreakFreeze(
  payload: ApplyStreakFreezeRequest,
): Promise<StreakState> {
  const response = await api.post<StreakState>(
    `/streak/profile/me/freeze`,
    payload,
  );

  return response.data;
}
