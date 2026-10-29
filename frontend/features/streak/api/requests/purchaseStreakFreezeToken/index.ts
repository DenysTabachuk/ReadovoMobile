import { api } from '@/features/auth';

import type { PurchaseStreakFreezeRequest, StreakState } from '../../../types';

export async function purchaseStreakFreezeToken(
  payload: PurchaseStreakFreezeRequest,
): Promise<StreakState> {
  const response = await api.post<StreakState>(
    `/streak/profile/me/freeze-token/purchase`,
    payload,
  );

  return response.data;
}
