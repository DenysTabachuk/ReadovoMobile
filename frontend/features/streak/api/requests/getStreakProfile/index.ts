import { mapHttpError } from '@/api/utils/mapHttpError';

import { api } from '@/features/auth';

import type { StreakState } from '../../../types';

export async function getStreakProfile(): Promise<StreakState> {
  const response = await api
    .get<StreakState>(`/streak/profile/me`)
    .catch(mapHttpError('profile.errors.loadFailed'));

  return response.data;
}
