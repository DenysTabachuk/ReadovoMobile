import { api } from '@/features/auth';

import { type AchievementsProfileResponse } from '@/api/generated/transport';

export async function getAchievementsProfile(): Promise<AchievementsProfileResponse> {
  const response = await api.get<AchievementsProfileResponse>(
    `/achievements/profile/me`,
  );

  return response.data;
}
