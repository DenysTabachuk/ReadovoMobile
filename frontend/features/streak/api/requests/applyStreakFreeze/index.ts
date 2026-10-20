import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import type { ApplyStreakFreezeRequest, StreakState } from '../../../types';
import { resolveStreakErrorMessage } from '../../utils/resolveStreakErrorMessage';

export async function applyStreakFreeze(
  payload: ApplyStreakFreezeRequest,
): Promise<StreakState> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/streak/profile/me/freeze`,
    {
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    throw new Error(
      await resolveStreakErrorMessage(
        response,
        'streak.errors.purchaseFreezeFailed',
      ),
    );
  }

  return response.json() as Promise<StreakState>;
}
