import { API_BASE_URL } from '@/api/auth/constants';

import {
  type AchievementsProfileResponse,
  type UpdateAchievementProgressDto,
} from './types';

export async function getAchievementsProfile(
  userId: string,
): Promise<AchievementsProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/achievements/profile/${userId}`);

  if (!response.ok) {
    throw new Error('profile.errors.loadFailed');
  }

  return response.json() as Promise<AchievementsProfileResponse>;
}

export async function updateAchievementsProgress(
  userId: string,
  payload: UpdateAchievementProgressDto,
): Promise<AchievementsProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/achievements/profile/${userId}/progress`, {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PATCH',
  });

  if (!response.ok) {
    throw new Error('profile.errors.loadFailed');
  }

  return response.json() as Promise<AchievementsProfileResponse>;
}
