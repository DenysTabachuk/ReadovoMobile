import { mapHttpError } from '@/api/utils/mapHttpError';

import { api } from '@/features/auth';

import { type AchievementsProfileResponse } from '../../../types';

export async function getAchievementsProfile(
  userId: string,
): Promise<AchievementsProfileResponse> {
  const response = await api
    .get<AchievementsProfileResponse>(`/achievements/profile/${userId}`)
    .catch(mapHttpError('profile.errors.loadFailed'));

  return response.data;
}
