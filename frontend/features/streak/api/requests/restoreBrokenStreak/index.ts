import { api } from '@/features/auth';

import type { StreakState } from '@/api/generated/transport';

export async function restoreBrokenStreak(): Promise<StreakState> {
  const response = await api.post<StreakState>(`/streak/profile/me/restore`);

  return response.data;
}
