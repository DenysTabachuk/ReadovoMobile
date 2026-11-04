import { api } from '@/features/auth';

import type { StreakState } from '@/api/generated/transport';

export async function getStreakProfile(): Promise<StreakState> {
  const response = await api.get<StreakState>(`/streak/profile/me`);

  return response.data;
}
