import { api } from '@/features/auth';

import {
  type AchievementsProfileResponse,
  type UpdateAchievementProgressDto,
} from '../../../types';

export async function updateAchievementsProgress(
  userId: string,
  payload: UpdateAchievementProgressDto,
): Promise<AchievementsProfileResponse> {
  const response = await api.patch<AchievementsProfileResponse>(
    `/achievements/profile/${userId}/progress`,
    payload,
  );

  return response.data;
}
