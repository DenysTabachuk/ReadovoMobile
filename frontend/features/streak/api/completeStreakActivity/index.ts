import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import type {
  CompleteActivityRequest,
  CompleteActivityResponse,
} from '../../types';

export async function completeStreakActivity(
  userId: string,
  payload: CompleteActivityRequest,
): Promise<CompleteActivityResponse> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/streak/profile/${userId}/activity-completed`,
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

  return response.json() as Promise<CompleteActivityResponse>;
}
