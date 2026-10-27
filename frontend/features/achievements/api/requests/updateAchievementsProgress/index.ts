import { mapHttpError } from '@/api/utils/mapHttpError';

import { api } from '@/features/auth';

import {
  type AchievementsProfileResponse,
  type UpdateAchievementProgressDto,
} from '../../../types';

export async function updateAchievementsProgress(
  userId: string,
  payload: UpdateAchievementProgressDto,
): Promise<AchievementsProfileResponse> {
  const response = await api
    .patch<AchievementsProfileResponse>(
      `/achievements/profile/${userId}/progress`,
      payload,
    )
    .catch(mapHttpError('profile.errors.loadFailed'));

  return response.data;
}
