import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import {
  type AchievementsProfileResponse,
  type UpdateAchievementProgressDto,
} from '../../types';

export async function updateAchievementsProgress(
  userId: string,
  payload: UpdateAchievementProgressDto,
): Promise<AchievementsProfileResponse> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/achievements/profile/${userId}/progress`,
    {
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
    },
  );

  if (!response.ok) {
    throw new Error('profile.errors.loadFailed');
  }

  return response.json() as Promise<AchievementsProfileResponse>;
}
