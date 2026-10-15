import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import type { RestoreStreakRequest, StreakState } from '../../types';
import { resolveStreakErrorMessage } from '../utils/resolveStreakErrorMessage';

export async function restoreBrokenStreak(
  userId: string,
  payload: RestoreStreakRequest,
): Promise<StreakState> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/streak/profile/${userId}/restore`,
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
      await resolveStreakErrorMessage(response, 'streak.errors.freezeFailed'),
    );
  }

  return response.json() as Promise<StreakState>;
}
