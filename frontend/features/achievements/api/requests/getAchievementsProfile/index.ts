import { api } from '@/features/auth';

import { type AchievementsProfileResponse } from '../../../types';

export async function getAchievementsProfile(
  userId: string,
): Promise<AchievementsProfileResponse> {
  const response = await api.get<AchievementsProfileResponse>(
    `/achievements/profile/${userId}`,
  );

  return response.data;
}
