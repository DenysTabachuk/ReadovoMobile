import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import { type AchievementsProfileResponse } from '../../types';

export async function getAchievementsProfile(
  userId: string,
): Promise<AchievementsProfileResponse> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/achievements/profile/${userId}`,
  );

  if (!response.ok) {
    throw new Error('profile.errors.loadFailed');
  }

  return response.json() as Promise<AchievementsProfileResponse>;
}
