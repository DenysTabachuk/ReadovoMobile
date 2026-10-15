import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import type { PurchaseStreakFreezeRequest, StreakState } from '../../types';

export async function purchaseStreakFreezeToken(
  userId: string,
  payload: PurchaseStreakFreezeRequest,
): Promise<StreakState> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/streak/profile/${userId}/freeze-token/purchase`,
    {
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    throw new Error('profile.errors.loadFailed');
  }

  return response.json() as Promise<StreakState>;
}
