import { api } from '@/features/auth';

import type { StreakState } from '@/api/generated/transport';

export async function purchaseStreakFreezeToken(): Promise<StreakState> {
  const response = await api.post<StreakState>(
    `/streak/profile/me/freeze-token/purchase`,
  );

  return response.data;
}
